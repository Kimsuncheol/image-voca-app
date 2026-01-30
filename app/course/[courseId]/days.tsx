import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
} from "firebase/firestore";

import { DayGrid, DayPickerHeader } from "../../../components/course";
import { SubscriptionBadge } from "../../../components/subscription";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";
import {
  DayProgress,
  useSubscriptionStore,
  useUserStatsStore,
} from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------
// DayProgress, CourseProgress imported from store

/**
 * DayPickerScreen Component
 *
 * Displays the grid of days for a specific course.
 *
 * Key Features:
 * - Load and display progress for each day (learned status, quiz status).
 * - Manage access control based on user subscription (Free vs Premium).
 * - Handle navigation to learning (Vocabulary) or testing (Quiz).
 * - Support Ad-based unlocking for specific days.
 */
const getCoursePath = (id: CourseType) => {
  switch (id) {
    case "수능":
      return process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "";
    case "TOEIC":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "";
    case "TOEFL":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "";
    case "TOEIC_SPEAKING":
      return process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "";
    case "IELTS":
      return process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "";
    case "OPIC":
      return process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "";
    case "COLLOCATION":
      return process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION || "";
    default:
      return "";
  }
};

const MIN_TOTAL_DAYS = 30;
const MAX_DAY_SCAN = 120;

export default function DayPickerScreen() {
  // ---------------------------------------------------------------------------
  // Hooks & Context
  // ---------------------------------------------------------------------------
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Route params: Identify which course we are viewing
  const { courseId } = useLocalSearchParams<{ courseId: CourseType }>();

  // Stores: Access stats and subscription logic
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const {
    canAccessUnlimitedVoca,
    canAccessFeature,
    canUnlockViaAd,
    fetchSubscription,
    loadUnlockedIds,
  } = useSubscriptionStore();

  // ---------------------------------------------------------------------------
  // Derived State & Constants
  // ---------------------------------------------------------------------------
  const course = useMemo(
    () => COURSES.find((c) => c.id === courseId),
    [courseId],
  );
  const [totalDays, setTotalDays] = useState(MIN_TOTAL_DAYS);
  const freeDayLimit = 3; // Days 1-3 are always free

  // Progress data for this specific course
  const dayProgress: Record<number, DayProgress> = useMemo(() => {
    if (!courseId) return {};
    return courseProgress[courseId] || {};
  }, [courseId, courseProgress]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  /**
   * Refetch subscription and progress whenever the screen gains focus.
   * This ensures that if a user buys a sub or watches an ad, the UI updates immediately.
   */
  useFocusEffect(
    useCallback(() => {
      if (!user || !courseId) return;

      fetchSubscription(user.uid);
      loadUnlockedIds(user.uid); // Load persisted ad unlocks for this user
      fetchCourseProgress(user.uid, courseId);
    }, [
      user,
      courseId,
      fetchSubscription,
      loadUnlockedIds,
      fetchCourseProgress,
    ]),
  );

  useEffect(() => {
    if (!courseId) return;

    let isActive = true;
    const loadTotalDays = async () => {
      const path = getCoursePath(courseId);
      if (!path) {
        console.warn("[Days] Missing course path for:", courseId);
        if (isActive) {
          setTotalDays(MIN_TOTAL_DAYS);
        }
        return;
      }

      try {
        const daysCollection = collection(db, path, "days");
        let daysCount = 0;
        try {
          const countSnapshot = await getCountFromServer(daysCollection);
          daysCount = countSnapshot.data().count;
        } catch (countError) {
          const snapshot = await getDocs(daysCollection);
          daysCount = snapshot.size;
          console.warn(
            "[Days] Count query failed, falling back to getDocs.",
            countError,
          );
        }

        let maxDayFromVocabulary = 0;

        if (daysCount === 0) {
          for (let day = 1; day <= MAX_DAY_SCAN; day += 1) {
            const dayCollection = collection(db, path, `Day${day}`);
            const daySnapshot = await getDocs(query(dayCollection, limit(1)));
            if (daySnapshot.empty) {
              if (maxDayFromVocabulary > 0) {
                break;
              }
              continue;
            }
            maxDayFromVocabulary = day;
          }
        } else if (daysCount <= MIN_TOTAL_DAYS) {
          for (let day = MIN_TOTAL_DAYS + 1; day <= MAX_DAY_SCAN; day += 1) {
            const dayCollection = collection(db, path, `Day${day}`);
            const daySnapshot = await getDocs(query(dayCollection, limit(1)));
            if (daySnapshot.empty) {
              break;
            }
            maxDayFromVocabulary = day;
          }
        }

        const resolvedCourseDays =
          daysCount > 0
            ? Math.max(daysCount, maxDayFromVocabulary)
            : maxDayFromVocabulary;
        const resolvedTotalDays = Math.max(
          MIN_TOTAL_DAYS,
          resolvedCourseDays,
        );

        if (isActive) {
          setTotalDays(resolvedTotalDays);
        }

        console.log(
          "[Days] courseId:",
          courseId,
          "daysCount:",
          daysCount,
          "maxDayFromVocabulary:",
          maxDayFromVocabulary,
          "resolvedCourseDays:",
          resolvedCourseDays,
          "totalDays:",
          resolvedTotalDays,
        );
      } catch (error) {
        console.error("[Days] Failed to load day count:", error);
        if (isActive) {
          setTotalDays(MIN_TOTAL_DAYS);
        }
      }
    };

    loadTotalDays();

    return () => {
      isActive = false;
    };
  }, [courseId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  /**
   * Handle tapping on a specific day card.
   * Checks for subscription status or free trial limits.
   */
  const handleDayPress = useCallback(
    (day: number) => {
      if (!courseId) return;
      const hasUnlimitedAccess = canAccessUnlimitedVoca();
      const featureId = `${courseId}_day_${day}`;
      const isDayUnlocked = canAccessFeature(featureId);

      // Access Check Logic
      if (!hasUnlimitedAccess && !isDayUnlocked && day > freeDayLimit) {
        // Scenario: User is Free, Day is locked, and beyond free limit.

        // Check if this day is eligible for ad-unlock (e.g. Days 4-10)
        const canUseAd = canUnlockViaAd(day);

        const alertButtons: any[] = [
          { text: t("common.cancel"), style: "cancel" },
        ];

        // Option 1: Watch Ad (if eligible)
        if (canUseAd) {
          alertButtons.push({
            text: t("course.watchAd", {
              defaultValue: "Watch Ad (Free Access)",
            }),
            onPress: () =>
              router.push({
                pathname: "/advertisement-modal",
                params: { featureId },
              }),
          });
        }

        // Option 2: Upgrade to Premium
        alertButtons.push({
          text: t("common.upgrade"),
          onPress: () => router.push("/billing"),
        });

        // Show Alert
        Alert.alert(
          t("alerts.premiumFeature.title"),
          canUseAd
            ? t("course.premiumLimitMessage", { day: freeDayLimit })
            : t("course.premiumOnlyMessage", {
                defaultValue: "Days beyond 10 require a premium subscription.",
              }),
          alertButtons,
        );
        return;
      }

      // Access Granted: Navigate to Vocabulary List
      router.push({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId, day: day.toString() },
      });
    },
    [
      canAccessFeature,
      canAccessUnlimitedVoca,
      canUnlockViaAd,
      courseId,
      freeDayLimit,
      router,
      t,
    ],
  );

  /**
   * Handle tapping the Quiz button on a day card.
   * Navigates to the Quiz Type selection screen.
   */
  const handleQuizPress = useCallback(
    (day: number) => {
      if (!courseId) return;
      router.push({
        pathname: "/course/[courseId]/quiz-type",
        params: { courseId, day: day.toString() },
      });
    },
    [courseId, router],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const hasUnlimitedAccess = canAccessUnlimitedVoca();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          title: course
            ? t(course.titleKey, { defaultValue: course.title })
            : t("course.days"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section: Course Title & Info */}
        <DayPickerHeader course={course} />

        {/* Subscription Status Banner */}
        <SubscriptionBadge />

        {/* Main Grid: Days 1-N */}
        <DayGrid
          totalDays={totalDays}
          dayProgress={dayProgress}
          courseColor={course?.color}
          canAccessUnlimitedVoca={hasUnlimitedAccess}
          canAccessFeature={canAccessFeature}
          courseId={courseId!}
          freeDayLimit={freeDayLimit}
          onDayPress={handleDayPress}
          onQuizPress={handleQuizPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});

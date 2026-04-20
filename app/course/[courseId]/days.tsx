import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopInstallNativeAd } from "../../../components/ads/TopInstallNativeAd";
import { AppSplashScreen } from "../../../components/common/AppSplashScreen";
import { DayGrid, EmptyDayView } from "../../../components/course";
import { ThemedText } from "../../../components/themed-text";
import { useAuth } from "../../../src/context/AuthContext";
import { useLearningLanguage } from "../../../src/context/LearningLanguageContext";
import { useTheme } from "../../../src/context/ThemeContext";
import {
  getTotalDaysForCourse,
  prefetchVocabularyCards,
} from "../../../src/services/vocabularyPrefetch";
import {
  DayProgress,
  useSubscriptionStore,
  useUserStatsStore,
} from "../../../src/stores";
import {
  CourseType,
  findRuntimeCourse,
  getLearningLanguageForCourse,
} from "../../../src/types/vocabulary";

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
 */
export default function DayPickerScreen() {
  // ---------------------------------------------------------------------------
  // Hooks & Context
  // ---------------------------------------------------------------------------
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { recentCourseByLanguage, setRecentCourseForLanguage } =
    useLearningLanguage();

  // Route params: Identify which course we are viewing
  const { courseId, initialTotalDays } = useLocalSearchParams<{
    courseId: CourseType;
    initialTotalDays?: string;
  }>();

  // Stores: Access stats and subscription logic
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const { fetchSubscription } = useSubscriptionStore();

  // ---------------------------------------------------------------------------
  // Derived State & Constants
  // ---------------------------------------------------------------------------
  const course = useMemo(() => findRuntimeCourse(courseId), [courseId]);
  const courseLanguage = useMemo(
    () => getLearningLanguageForCourse(courseId),
    [courseId],
  );
  const [totalDays, setTotalDays] = useState(() => {
    const parsed = initialTotalDays ? parseInt(initialTotalDays, 10) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(
    !initialTotalDays || isNaN(parseInt(initialTotalDays, 10)),
  );
  const [splashVisible, setSplashVisible] = useState(
    !initialTotalDays || isNaN(parseInt(initialTotalDays, 10)),
  );
  // Progress data for this specific course
  const dayProgress: Record<number, DayProgress> = useMemo(() => {
    if (!courseId) return {};
    return courseProgress[courseId] || {};
  }, [courseId, courseProgress]);

  // First day that hasn't been completed yet
  const firstIncompleteDay = useMemo(() => {
    for (let day = 1; day <= totalDays; day++) {
      if (!dayProgress[day]?.completed) return day;
    }
    return totalDays;
  }, [dayProgress, totalDays]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  /**
   * Refetch subscription and progress whenever the screen gains focus.
   * This ensures the UI reflects the latest access state immediately.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        !course ||
        !courseId ||
        !courseLanguage ||
        recentCourseByLanguage[courseLanguage] === courseId
      ) {
        return;
      }

      void setRecentCourseForLanguage(courseLanguage, courseId).catch(
        (error) => {
          console.error("Failed to persist recent course:", error);
        },
      );
    }, [
      course,
      courseId,
      courseLanguage,
      recentCourseByLanguage,
      setRecentCourseForLanguage,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user || !courseId) return;

      fetchSubscription(user.uid);
      fetchCourseProgress(user.uid, courseId);
    }, [user, courseId, fetchSubscription, fetchCourseProgress]),
  );

  useEffect(() => {
    if (!courseId) return;

    let isActive = true;
    const loadTotalDays = async () => {
      try {
        // Fetch totalDays from course metadata
        const days = await getTotalDaysForCourse(courseId);

        if (isActive) {
          setTotalDays(days);
          setInitialLoading(false);
        }

        console.log(
          "[Days] courseId:",
          courseId,
          "totalDays from metadata:",
          days,
        );
      } catch (error) {
        console.error("[Days] Failed to load day count:", error);
        if (isActive) {
          setInitialLoading(false);
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
   * Checks for sequential progression and subscription status.
   */
  const handleDayPress = useCallback(
    async (day: number) => {
      if (!courseId) return;

      // Check 1: Sequential Progression - Must complete previous day first
      if (day > 1) {
        const previousDay = day - 1;
        const previousDayProgress = dayProgress[previousDay];

        if (!previousDayProgress?.completed) {
          Alert.alert(
            t("course.lockedDay.title", { defaultValue: "Day Locked" }),
            t("course.lockedDay.message", {
              defaultValue: `Please complete Day ${previousDay} first to unlock Day ${day}.`,
              previousDay,
              currentDay: day,
            }),
            [{ text: t("common.ok", { defaultValue: "OK" }), style: "cancel" }],
          );
          return;
        }
      }

      // Access Granted: Prefetch cards + images, then navigate
      setLoadingDay(day);
      const PREFETCH_TIMEOUT_MS = 8000;
      try {
        const cards = await Promise.race([
          prefetchVocabularyCards(courseId as CourseType, day),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("prefetch timeout")),
              PREFETCH_TIMEOUT_MS,
            ),
          ),
        ]);
        const imageUrls = cards
          .map((c) => c.imageUrl)
          .filter((url): url is string => Boolean(url));
        if (imageUrls.length > 0) {
          await Image.prefetch(imageUrls, "memory-disk").catch(() => {});
        }
      } catch {
        // On timeout or error, navigate anyway — vocabulary screen handles its own loading
      } finally {
        setLoadingDay(null);
      }
      router.push({
        pathname: "/course/[courseId]/vocabulary",
        params: { courseId, day: day.toString() },
      });
    },
    [courseId, dayProgress, router, t],
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
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "bottom"]}
    >
      <Stack.Screen
        options={{
          headerShown: loadingDay === null && totalDays > 0,
          title:
            loadingDay !== null
              ? ""
              : course
                ? t(course.titleKey, { defaultValue: course.title })
                : t("course.days"),
          headerBackTitle: t("common.back"),
          headerBackVisible: loadingDay === null ? true : false,
        }}
      />
      <TopInstallNativeAd />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Continue banner — shown when the user has prior progress */}
        {firstIncompleteDay > 1 && (
          <TouchableOpacity
            style={[
              styles.continueBanner,
              {
                backgroundColor: (course?.color ?? "#007AFF") + "18",
                borderColor: course?.color ?? "#007AFF",
              },
            ]}
            onPress={() => handleDayPress(firstIncompleteDay)}
            disabled={loadingDay !== null}
            activeOpacity={0.75}
          >
            <View style={styles.continueBannerLeft}>
              <ThemedText
                style={[
                  styles.continueBannerLabel,
                  { color: course?.color ?? "#007AFF" },
                ]}
              >
                {t("course.continueFrom", { defaultValue: "Continue" })}
              </ThemedText>
              <ThemedText style={styles.continueBannerDay}>
                {t("course.dayTitle", { day: firstIncompleteDay })}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={course?.color ?? "#007AFF"}
            />
          </TouchableOpacity>
        )}

        {/* Main Grid: Days 1-N */}
        {totalDays === 0 ? (
          <EmptyDayView />
        ) : (
          <DayGrid
            totalDays={totalDays}
            dayProgress={dayProgress}
            courseColor={course?.color}
            courseId={courseId!}
            onDayPress={handleDayPress}
            onQuizPress={handleQuizPress}
          />
        )}
      </ScrollView>

      {loadingDay !== null && (
        <AppSplashScreen visible={true} onHidden={() => {}} />
      )}
      {splashVisible && (
        <AppSplashScreen
          visible={initialLoading}
          onHidden={() => setSplashVisible(false)}
        />
      )}
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
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  continueBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  continueBannerLeft: {
    gap: 2,
  },
  continueBannerLabel: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  continueBannerDay: {
    fontSize: 18,
    fontWeight: "700",
  },
});

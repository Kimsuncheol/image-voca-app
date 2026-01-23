import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayGrid, DayPickerHeader } from "../../../components/course";
import { SubscriptionBadge } from "../../../components/subscription";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { useSubscriptionStore, useUserStatsStore } from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

interface DayProgress {
  completed: boolean;
  wordsLearned: number;
  totalWords: number;
  quizCompleted: boolean;
  isRetake?: boolean;
}

export default function DayPickerScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: CourseType }>();
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();
  const {
    canAccessUnlimitedVoca,
    canAccessFeature,
    canUnlockViaAd,
    fetchSubscription,
    loadUnlockedIds,
  } = useSubscriptionStore();

  const course = COURSES.find((c) => c.id === courseId);
  const totalDays = 30;
  const freeDayLimit = 3;

  const dayProgress: Record<number, DayProgress> = courseId
    ? courseProgress[courseId] || {}
    : {};

  useFocusEffect(
    useCallback(() => {
      if (!user || !courseId) return;

      fetchSubscription(user.uid);
      loadUnlockedIds(user.uid); // Load persisted ad unlocks for this user
      fetchCourseProgress(user.uid, courseId);
    }, [user, courseId, fetchSubscription, loadUnlockedIds, fetchCourseProgress]),
  );

  const handleDayPress = (day: number) => {
    const hasUnlimitedAccess = canAccessUnlimitedVoca();
    const featureId = `${courseId}_day_${day}`;
    const isDayUnlocked = canAccessFeature(featureId);

    if (!hasUnlimitedAccess && !isDayUnlocked && day > freeDayLimit) {
      // Days 4-10: Show ad option; Days 11+: Premium only
      const canUseAd = canUnlockViaAd(day);

      const alertButtons: any[] = [
        { text: t("common.cancel"), style: "cancel" },
      ];

      if (canUseAd) {
        alertButtons.push({
          text: t("course.watchAd", { defaultValue: "Watch Ad (Free Access)" }),
          onPress: () =>
            router.push({
              pathname: "/advertisement-modal",
              params: { featureId },
            }),
        });
      }

      alertButtons.push({
        text: t("common.upgrade"),
        onPress: () => router.push("/billing"),
      });

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
    router.push({
      pathname: "/course/[courseId]/vocabulary",
      params: { courseId, day: day.toString() },
    });
  };

  const handleQuizPress = (day: number) => {
    router.push({
      pathname: "/course/[courseId]/quiz-type",
      params: { courseId, day: day.toString() },
    });
  };

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
        <DayPickerHeader course={course} />
        <SubscriptionBadge />
        <DayGrid
          totalDays={totalDays}
          dayProgress={dayProgress}
          courseColor={course?.color}
          canAccessUnlimitedVoca={canAccessUnlimitedVoca()}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});

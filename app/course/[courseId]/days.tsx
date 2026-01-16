import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DayGrid, DayPickerHeader } from "../../../components/course";
import { SubscriptionBadge } from "../../../components/subscription";
import { useAuth } from "../../../src/context/AuthContext";
import { useTheme } from "../../../src/context/ThemeContext";
import { db } from "../../../src/services/firebase";
import { useSubscriptionStore } from "../../../src/stores";
import { COURSES, CourseType } from "../../../src/types/vocabulary";

interface DayProgress {
  completed: boolean;
  wordsLearned: number;
  totalWords: number;
  quizCompleted: boolean;
}

export default function DayPickerScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: CourseType }>();
  const [dayProgress, setDayProgress] = useState<Record<number, DayProgress>>(
    {}
  );
  const { canAccessUnlimitedVoca, canAccessFeature, fetchSubscription } =
    useSubscriptionStore();

  const course = COURSES.find((c) => c.id === courseId);
  const totalDays = 30;
  const freeDayLimit = 3;

  const fetchDayProgress = useCallback(async () => {
    if (!user || !courseId) return;
    try {
      fetchSubscription(user.uid);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const courseProgress = userDoc.data().courseProgress || {};
        setDayProgress(courseProgress[courseId] || {});
      }
    } catch (error) {
      console.error("Error fetching day progress:", error);
    }
  }, [user, courseId, fetchSubscription]);

  useEffect(() => {
    fetchDayProgress();
  }, [fetchDayProgress]);

  const handleDayPress = (day: number) => {
    const hasUnlimitedAccess = canAccessUnlimitedVoca();
    const featureId = `${courseId}_day_${day}`;
    const isDayUnlocked = canAccessFeature(featureId);

    if (!hasUnlimitedAccess && !isDayUnlocked && day > freeDayLimit) {
      Alert.alert(
        t("alerts.premiumFeature.title"),
        t("course.premiumLimitMessage", { day: freeDayLimit }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: "Watch Ad (Free Access)",
            onPress: () =>
              router.push({
                pathname: "/advertisement-modal",
                params: { featureId },
              }),
          },
          { text: t("common.upgrade"), onPress: () => router.push("/billing") },
        ]
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

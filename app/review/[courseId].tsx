import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { COURSES, CourseType } from "../../src/types/vocabulary";

interface DayProgress {
  completed: boolean;
  wordsLearned: number;
  totalWords: number;
  quizCompleted: boolean;
  quizScore?: number;
}

export default function ReviewDaysScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { courseId } = useLocalSearchParams<{ courseId: CourseType }>();
  const [dayProgress, setDayProgress] = useState<Record<number, DayProgress>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const course = COURSES.find((c) => c.id === courseId);

  const fetchDayProgress = useCallback(async () => {
    if (!user || !courseId) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const courseProgress = userDoc.data().courseProgress || {};
        const progress = courseProgress[courseId] || {};
        setDayProgress(progress);

        // Get completed days
        const completed = Object.entries(progress)
          .filter(([_, data]: [string, any]) => data.completed)
          .map(([day]) => parseInt(day, 10))
          .sort((a, b) => a - b);
        setCompletedDays(completed);
      }
    } catch (error) {
      console.error("Error fetching day progress:", error);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchDayProgress();
  }, [fetchDayProgress]);

  const handleDayPress = (day: number) => {
    router.push({
      pathname: "/review/words",
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
            : t("review.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">
            {course
              ? t(course.titleKey, { defaultValue: course.title })
              : t("review.title")}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("review.daysCompleted", { count: completedDays.length })}
          </ThemedText>
        </View>

        {completedDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={64}
              color={isDark ? "#444" : "#ccc"}
            />
            <ThemedText style={styles.emptyText}>
              {t("review.empty.title")}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {t("review.empty.subtitle")}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.daysGrid}>
            {completedDays.map((day) => {
              const progress = dayProgress[day];
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCard,
                    { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayHeader}>
                    <ThemedText type="subtitle" style={styles.dayNumber}>
                      {t("course.dayTitle", { day })}
                    </ThemedText>
                    {progress?.quizCompleted && (
                      <View
                        style={[
                          styles.scoreBadge,
                          {
                            backgroundColor:
                              (progress.quizScore || 0) >= 80
                                ? "#28a745"
                                : (progress.quizScore || 0) >= 60
                                ? "#ffc107"
                                : "#dc3545",
                          },
                        ]}
                      >
                        <ThemedText style={styles.scoreText}>
                          {progress.quizScore}%
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.wordsCount}>
                    {t("courses.wordCount", {
                      count: progress?.wordsLearned || 0,
                    })}
                  </ThemedText>
                  <View style={styles.statusRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={course?.color}
                    />
                    <ThemedText style={styles.statusText}>
                      {t("review.completed")}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dayCard: {
    width: "30%",
    padding: 12,
    borderRadius: 12,
    minHeight: 100,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 14,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  wordsCount: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    opacity: 0.6,
  },
});

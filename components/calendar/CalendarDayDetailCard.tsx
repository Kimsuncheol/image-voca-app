import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { DailyStats } from "../../src/stores";
import { useTheme } from "../../src/context/ThemeContext";
import type { VocabularyDayStudyEntry } from "../../src/services/dailyStudyHistory";
import { findRuntimeCourse } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { DayBadge } from "../common/DayBadge";

interface CalendarDayDetailCardProps {
  title: string;
  stats?: DailyStats;
  contributedToStreak: boolean;
  vocabularyDays: VocabularyDayStudyEntry[];
  isHistoryLoading: boolean;
  onPressVocabularyDay: (entry: VocabularyDayStudyEntry) => void;
}

const formatAccuracy = (stats: DailyStats) => {
  if (stats.totalAnswers <= 0) {
    return null;
  }

  return `${Math.round((stats.correctAnswers / stats.totalAnswers) * 100)}%`;
};

export function CalendarDayDetailCard({
  title,
  stats,
  contributedToStreak,
  vocabularyDays,
  isHistoryLoading,
  onPressVocabularyDay,
}: CalendarDayDetailCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const historyRowBackground = isDark ? "#1D2129" : "#FFFFFF";
  const historyRowPressedBackground = isDark ? "#242A33" : "#EEF3FB";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#13151A" : "#F5F7FB" },
      ]}
    >
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {!stats ? (
        <ThemedText style={styles.emptyText}>
          {t("calendar.detail.noStudy")}
        </ThemedText>
      ) : (
        <View style={styles.metrics}>
          <View style={styles.metricRow}>
            <ThemedText style={styles.label}>
              {t("calendar.detail.wordsLearned")}
            </ThemedText>
            <ThemedText style={styles.value}>{stats.wordsLearned}</ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText style={styles.label}>
              {t("calendar.detail.minutesSpent")}
            </ThemedText>
            <ThemedText style={styles.value}>{stats.timeSpentMinutes}</ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText style={styles.label}>
              {t("calendar.detail.quizAccuracy")}
            </ThemedText>
            <ThemedText style={styles.value}>
              {formatAccuracy(stats) ?? t("calendar.detail.noQuiz")}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText style={styles.label}>
              {t("calendar.detail.streakContribution")}
            </ThemedText>
            <ThemedText style={styles.value}>
              {contributedToStreak ? t("calendar.detail.yes") : t("calendar.detail.no")}
            </ThemedText>
          </View>
        </View>
      )}
      <View
        style={[
          styles.historySection,
          { borderTopColor: isDark ? "#262A33" : "#E4E8EF" },
        ]}
      >
        <ThemedText type="subtitle" style={styles.historyTitle}>
          {t("calendar.detail.studiedCourses")}
        </ThemedText>
        {isHistoryLoading ? (
          <ThemedText style={styles.historyEmptyText}>
            {t("calendar.detail.loadingStudiedCourses")}
          </ThemedText>
        ) : vocabularyDays.length === 0 ? (
          <ThemedText style={styles.historyEmptyText}>
            {t("calendar.detail.noStudiedCourses")}
          </ThemedText>
        ) : (
          <View style={styles.historyList}>
            {vocabularyDays.map((entry) => {
              const course = findRuntimeCourse(entry.courseId);
              const courseTitle = course
                ? t(course.titleKey, { defaultValue: course.title })
                : entry.courseId;

              return (
                <Pressable
                  key={`${entry.courseId}-${entry.dayNumber}`}
                  accessibilityRole="button"
                  onPress={() => onPressVocabularyDay(entry)}
                  style={({ pressed }) => [
                    styles.historyRow,
                    {
                      backgroundColor: pressed
                        ? historyRowPressedBackground
                        : historyRowBackground,
                    },
                  ]}
                >
                  <View style={styles.historyTextBlock}>
                    <ThemedText style={styles.historyCourseTitle}>
                      {courseTitle}
                    </ThemedText>
                    <ThemedText style={styles.historyMeta}>
                      {t("calendar.detail.wordsProgress", {
                        learned: entry.wordsLearned,
                        total: entry.totalWords,
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.badgeWrapper}>
                    <DayBadge day={entry.dayNumber} isDark={isDark} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 32,
  },
  title: {
    marginBottom: 14,
  },
  emptyText: {
    opacity: 0.7,
  },
  metrics: {
    gap: 14,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    opacity: 0.66,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
  },
  historySection: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  historyTitle: {
    marginBottom: 12,
  },
  historyEmptyText: {
    opacity: 0.7,
  },
  historyList: {
    gap: 10,
  },
  historyRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyTextBlock: {
    flex: 1,
  },
  historyCourseTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 13,
    opacity: 0.62,
  },
  badgeWrapper: {
    marginTop: -6,
  },
});

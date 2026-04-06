import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { DailyStats } from "../../src/stores";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface CalendarDayDetailCardProps {
  title: string;
  stats?: DailyStats;
  contributedToStreak: boolean;
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
}: CalendarDayDetailCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

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
});

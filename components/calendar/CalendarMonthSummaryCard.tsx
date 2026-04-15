import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import type { CalendarMonthSummary } from "../../src/utils/calendarStats";
import { ThemedText } from "../themed-text";

interface CalendarMonthSummaryCardProps {
  summary: CalendarMonthSummary;
  currentStreak: number;
}

export function CalendarMonthSummaryCard({
  summary,
  currentStreak,
}: CalendarMonthSummaryCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const stats = [
    { label: t("calendar.summary.studyDays"), value: summary.studyDays },
    { label: t("calendar.summary.wordsLearned"), value: summary.wordsLearned },
    { label: t("calendar.summary.currentStreak"), value: currentStreak },
  ];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#13151A" : "#F5F7FB" },
      ]}
    >
      <ThemedText type="subtitle" style={styles.title}>
        {t("calendar.summary.title")}
      </ThemedText>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.metric,
              { backgroundColor: isDark ? "#1D2129" : "#FFFFFF" },
            ]}
          >
            <ThemedText style={styles.metricLabel}>{stat.label}</ThemedText>
            <ThemedText type="title" style={styles.metricValue}>
              {stat.value}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  title: {
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metric: {
    width: "47%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.62,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 30,
  },
});

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import type { CalendarMonthSummary } from "../../src/utils/calendarStats";
import { ThemedText } from "../themed-text";

interface CalendarMonthSummaryCardProps {
  summary: CalendarMonthSummary;
  currentStreak: number;
}

function MetricBox({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string | number;
  isDark: boolean;
}) {
  const [borderRad, setBorderRad] = React.useState(16);
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: isDark ? "#1D2129" : "#FFFFFF",
          borderRadius: borderRad,
        },
      ]}
      onLayout={(e) => setBorderRad(e.nativeEvent.layout.width * 0.2)}
    >
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

export function CalendarMonthSummaryCard({
  summary,
  currentStreak,
}: CalendarMonthSummaryCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.card, { backgroundColor: isDark ? "#13151A" : "#F5F7FB" }]}
    >
      <ThemedText type="subtitle" style={styles.title}>
        {t("calendar.summary.title")}
      </ThemedText>
      <View style={styles.grid}>
        <MetricBox
          label={t("calendar.summary.studyDays")}
          value={summary.studyDays}
          isDark={isDark}
        />
        <MetricBox
          label={t("calendar.summary.wordsLearned")}
          value={summary.wordsLearned}
          isDark={isDark}
        />
        <MetricBox
          label={t("calendar.summary.currentStreak")}
          value={currentStreak}
          isDark={isDark}
        />
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
    gap: 10,
  },
  metric: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  metricLabel: {
    fontSize: 13,
    opacity: 0.66,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
});

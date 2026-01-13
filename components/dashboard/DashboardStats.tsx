import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { DashboardCard } from "./DashboardCard";

interface DashboardStatsProps {
  wordsLearned: number;
  streak: number;
  accuracy: number;
  timeSpent: number;
}

export function DashboardStats({
  wordsLearned,
  streak,
  accuracy,
  timeSpent,
}: DashboardStatsProps) {
  const { t } = useTranslation();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}.${Math.round((mins / 60) * 10)}h` : `${hours}h`;
  };

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.stats.title")}
      </ThemedText>
      <View style={styles.statsGrid}>
        <DashboardCard
          title={t("dashboard.stats.wordsLearned")}
          value={wordsLearned}
          subtitle={t("dashboard.stats.thisWeek")}
          icon="book.fill"
          color="#FF6B6B"
        />
        <DashboardCard
          title={t("dashboard.stats.streak")}
          value={streak}
          subtitle={t("dashboard.stats.days")}
          icon="flame.fill"
          color="#FFE66D"
        />
      </View>
      <View style={[styles.statsGrid, { marginTop: 12 }]}>
        <DashboardCard
          title={t("dashboard.stats.accuracy")}
          value={`${accuracy}%`}
          subtitle={t("dashboard.stats.last7Days")}
          icon="checkmark.circle.fill"
          color="#4ECDC4"
        />
        <DashboardCard
          title={t("dashboard.stats.timeSpent")}
          value={formatTime(timeSpent)}
          subtitle={t("dashboard.stats.thisWeek")}
          icon="clock.fill"
          color="#95E1D3"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
});

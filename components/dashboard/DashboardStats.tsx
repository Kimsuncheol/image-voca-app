import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { DashboardCard } from "./DashboardCard";

interface DashboardStatsProps {
  wordsLearned: number;
  streak: number;
}

export function DashboardStats({
  wordsLearned,
  streak,
}: DashboardStatsProps) {
  const { t } = useTranslation();

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

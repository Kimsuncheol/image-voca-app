import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { DashboardCard } from "./DashboardCard";

interface DashboardStatsProps {
  streak: number;
  todayLearned: number;
  onCalendarPress?: () => void;
}

export function DashboardStats({
  streak,
  todayLearned,
  onCalendarPress,
}: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.stats.title")}
      </ThemedText>
      <View style={styles.statsGrid}>
        <DashboardCard
          title={t("dashboard.stats.streak")}
          value={streak}
          subtitle={t("dashboard.stats.days")}
          icon="flame.fill"
          color="#FFE66D"
        />
        <DashboardCard
          title={t("dashboard.stats.todayLearned")}
          value={todayLearned}
          subtitle={t("common.words")}
          icon="book.fill"
          color="#4A90E2"
          onPress={onCalendarPress}
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

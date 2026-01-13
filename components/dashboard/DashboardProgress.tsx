import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useUserStatsStore } from "../../src/stores";
import { ThemedText } from "../themed-text";
import { ProgressCard } from "./ProgressCard";

export function DashboardProgress() {
  const { t } = useTranslation();
  const { getTodayProgress } = useUserStatsStore();
  const { current, goal } = getTodayProgress();

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t("dashboard.todayProgress")}
      </ThemedText>
      <ProgressCard
        title={t("dashboard.dailyGoal")}
        current={current}
        total={goal}
        unit={t("common.words")}
      />
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
});

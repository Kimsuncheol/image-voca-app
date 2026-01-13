import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ProgressCard } from "./ProgressCard";

interface DashboardProgressProps {
  current: number;
  goal: number;
}

export function DashboardProgress({ current, goal }: DashboardProgressProps) {
  const { t } = useTranslation();

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

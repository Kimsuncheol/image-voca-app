/**
 * Analytics Row Component
 *
 * Navigation row to view analytics and reports
 */

import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../../admin/AdminNavRow";
import { SettingsNavRowProps } from "../../../../src/types/settings";

export const AnalyticsRow: React.FC<SettingsNavRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.teacher.analytics") || "Analytics"}
      icon="stats-chart-outline"
      onPress={() => router.push("/teacher/classes")} // Will navigate from classes
      isDark={isDark}
      styles={styles}
      showSeparator={false} // Last item, no separator
    />
  );
};

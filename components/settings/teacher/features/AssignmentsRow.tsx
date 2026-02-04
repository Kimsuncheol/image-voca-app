/**
 * Assignments Row Component
 *
 * Navigation row to manage assignments
 */

import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../../admin/AdminNavRow";
import { SettingsNavRowProps } from "../../../../src/types/settings";

export const AssignmentsRow: React.FC<SettingsNavRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.teacher.assignments") || "Assignments"}
      icon="clipboard-outline"
      onPress={() => router.push("/teacher/classes")} // Will navigate from classes
      isDark={isDark}
      styles={styles}
    />
  );
};

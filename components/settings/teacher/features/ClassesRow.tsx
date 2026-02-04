/**
 * Classes Row Component
 *
 * Navigation row to manage classes
 */

import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../../admin/AdminNavRow";
import { SettingsNavRowProps } from "../../../../src/types/settings";

export const ClassesRow: React.FC<SettingsNavRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.teacher.classes") || "Manage Classes"}
      icon="school-outline"
      onPress={() => router.push("/teacher/classes")}
      isDark={isDark}
      styles={styles}
    />
  );
};

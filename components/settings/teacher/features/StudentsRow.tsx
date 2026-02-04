/**
 * Students Row Component
 *
 * Navigation row to view all students
 */

import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../../admin/AdminNavRow";
import { SettingsNavRowProps } from "../../../../src/types/settings";

export const StudentsRow: React.FC<SettingsNavRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.teacher.students") || "All Students"}
      icon="people-outline"
      onPress={() => router.push("/teacher/classes")} // Will go to classes, then students
      isDark={isDark}
      styles={styles}
    />
  );
};

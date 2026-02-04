/**
 * Teacher Section Component
 *
 * Settings section for teacher features
 * Only visible to users with teacher or admin role
 */

import React from "react";
import { Text, View } from "react-native";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { SettingsSectionProps } from "../../src/types/settings";
import { ClassesRow } from "./teacher/features/ClassesRow";
import { StudentsRow } from "./teacher/features/StudentsRow";
import { AssignmentsRow } from "./teacher/features/AssignmentsRow";
import { AnalyticsRow } from "./teacher/features/AnalyticsRow";

export const TeacherSection: React.FC<SettingsSectionProps> = ({
  styles,
  t,
  isDark = false,
}) => {
  const isTeacher = useSubscriptionStore((state) => state.isTeacher);

  if (!isTeacher()) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("settings.teacher.title") || "Teacher"}
      </Text>
      <View style={styles.card}>
        <ClassesRow styles={styles} isDark={isDark} t={t} />
        <StudentsRow styles={styles} isDark={isDark} t={t} />
        <AssignmentsRow styles={styles} isDark={isDark} t={t} />
        <AnalyticsRow styles={styles} isDark={isDark} t={t} />
      </View>
    </View>
  );
};

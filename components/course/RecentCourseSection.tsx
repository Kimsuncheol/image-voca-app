import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { Course } from "../../src/types/vocabulary";
import { CourseCard } from "../course";
import { ThemedText } from "../themed-text";

interface RecentCourseSectionProps {
  course: Course;
  onPress: () => void;
}

export function RecentCourseSection({
  course,
  onPress,
}: RecentCourseSectionProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="time-outline"
          size={20}
          color={isDark ? "#888" : "#666"}
        />
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {t("courses.recentCourse")}
        </ThemedText>
      </View>
      <CourseCard course={course} onPress={onPress} isRecent />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
});

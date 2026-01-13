import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { Course } from "../../src/types/vocabulary";
import { CourseCard } from "../course";
import { ThemedText } from "../themed-text";

interface AllCoursesSectionProps {
  courses: Course[];
  onCoursePress: (course: Course) => void;
}

export function AllCoursesSection({
  courses,
  onCoursePress,
}: AllCoursesSectionProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="library-outline"
          size={20}
          color={isDark ? "#888" : "#666"}
        />
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {t("courses.allCourses")}
        </ThemedText>
      </View>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onPress={() => onCoursePress(course)}
        />
      ))}
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

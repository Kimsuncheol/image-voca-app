import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { COURSES, CourseType } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";

interface WordBankCourseGridProps {
  onCoursePress: (courseId: CourseType) => void;
}

export function WordBankCourseGrid({ onCoursePress }: WordBankCourseGridProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.courseGrid}>
      {COURSES.map((course) => (
        <TouchableOpacity
          key={course.id}
          style={[
            styles.courseCard,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
          onPress={() => onCoursePress(course.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: course.color + "20" },
            ]}
          >
            <Ionicons
              name={course.icon as any}
              size={32}
              color={course.color}
            />
          </View>
          <ThemedText type="subtitle" style={styles.courseTitle}>
            {t(course.titleKey, { defaultValue: course.title })}
          </ThemedText>
          <ThemedText style={styles.courseDescription}>
            {t(course.descriptionKey, { defaultValue: course.description })}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  courseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  courseCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  courseDescription: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
});

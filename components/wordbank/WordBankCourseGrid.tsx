import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";
import {
  Course,
  CourseType,
} from "../../src/types/vocabulary";
import { CompletedStamp } from "../course/CompletedStamp";
import { ThemedText } from "../themed-text";

interface WordBankCourseGridProps {
  courses: Course[];
  onCoursePress: (course: Course) => void;
  completedCourseIds?: Partial<Record<CourseType, boolean>>;
}

export function WordBankCourseGrid({
  courses,
  onCoursePress,
  completedCourseIds = {},
}: WordBankCourseGridProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View testID="wordbank-course-grid" style={styles.courseGrid}>
      {courses.map((course) => (
        <TouchableOpacity
          key={course.id}
          testID={`wordbank-course-card-${course.id}`}
          style={[
            styles.courseCard,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
          onPress={() => onCoursePress(course)}
          activeOpacity={0.7}
        >
          {completedCourseIds[course.id] === true ? (
            <CompletedStamp
              testID={`course-card-completed-${course.id}`}
              accessibilityLabel={t("common.completed", {
                defaultValue: "Completed",
              })}
            />
          ) : null}
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
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    position: "relative",
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
    fontSize: FontSizes.bodyLg,
    textAlign: "center",
  },
  courseDescription: {
    fontSize: FontSizes.caption,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
});

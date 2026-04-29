import { FontWeights } from "@/constants/fontWeights";
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
import { ThemedText } from "../themed-text";

interface WordBankCourseGridProps {
  courses: Course[];
  onCoursePress: (courseId: CourseType) => void;
  wordCounts?: Record<string, number>;
}

export function WordBankCourseGrid({
  courses,
  onCoursePress,
  wordCounts = {},
}: WordBankCourseGridProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.courseGrid}>
      {courses.map((course) => {
        const count = wordCounts[course.id] ?? 0;
        return (
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
            {count > 0 && (
              <ThemedText style={[styles.wordCountBadge, { color: course.color }]}>
                {t("wordBank.wordsCount", { count })}
              </ThemedText>
            )}
          </TouchableOpacity>
        );
      })}
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
    fontSize: FontSizes.bodyLg,
    textAlign: "center",
  },
  courseDescription: {
    fontSize: FontSizes.caption,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
  wordCountBadge: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.semiBold,
    marginTop: 6,
  },
});

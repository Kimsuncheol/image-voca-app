import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { RuntimeCourse } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface CourseCardProps {
  course: RuntimeCourse;
  onPress: () => void;
  isRecent?: boolean;
}

export function CourseCard({ course, onPress, isRecent }: CourseCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        isRecent && { borderWidth: 2, borderColor: course.color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: course.color + "20" }]}>
        <Ionicons name={course.icon as any} size={28} color={course.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle">
            {t(course.titleKey, { defaultValue: course.title })}
          </ThemedText>
          {isRecent && (
            <View style={[styles.recentBadge, { backgroundColor: course.color }]}>
              <ThemedText style={styles.recentText}>
                {t("courses.recent")}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={styles.description}>
          {t(course.descriptionKey, { defaultValue: course.description })}
        </ThemedText>
        <ThemedText style={styles.wordCount}>
          {t("courses.wordCount", { count: course.wordCount })}
        </ThemedText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#666" : "#999"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  description: {
    fontSize: FontSizes.label,
    opacity: 0.6,
    marginTop: 2,
  },
  wordCount: {
    fontSize: FontSizes.caption,
    opacity: 0.5,
    marginTop: 4,
  },
  recentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentText: {
    fontSize: FontSizes.xs,
    color: "#fff",
    fontWeight: FontWeights.semiBold,
  },
});

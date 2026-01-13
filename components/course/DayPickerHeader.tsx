import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Course } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";

interface DayPickerHeaderProps {
  course?: Course;
}

export function DayPickerHeader({ course }: DayPickerHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <ThemedText type="title">
        {course
          ? t(course.titleKey, { defaultValue: course.title })
          : t("course.days")}
      </ThemedText>
      <ThemedText style={styles.subtitle}>{t("course.selectDay")}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
});

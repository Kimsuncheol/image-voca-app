import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Course } from "../../src/types/vocabulary";
import { ThemedText } from "../themed-text";

interface QuizTypeHeaderProps {
  course?: Course;
  day: string;
}

export function QuizTypeHeader({ course, day }: QuizTypeHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <ThemedText type="title">{t("quiz.selectType")}</ThemedText>
      <ThemedText style={styles.subtitle}>
        {course
          ? t("quiz.courseDaySubtitle", {
              course: t(course.titleKey, { defaultValue: course.title }),
              day,
            })
          : t("course.dayTitle", { day })}
      </ThemedText>
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

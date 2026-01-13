import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function CourseLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="[courseId]/days"
        options={{ title: t("course.days") }}
      />
      <Stack.Screen
        name="[courseId]/vocabulary"
        options={{ title: t("courses.vocabularyTitle") }}
      />
      <Stack.Screen
        name="[courseId]/quiz-type"
        options={{ title: t("quiz.typeTitle") }}
      />
      <Stack.Screen
        name="[courseId]/quiz-play"
        options={{ title: t("course.quiz") }}
      />
    </Stack>
  );
}

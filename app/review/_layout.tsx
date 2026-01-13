import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function ReviewLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("review.title") }} />
      <Stack.Screen name="[courseId]" options={{ title: t("course.days") }} />
      <Stack.Screen name="words" options={{ title: t("review.wordsTitle") }} />
    </Stack>
  );
}

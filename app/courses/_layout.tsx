import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function WordBankLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="[course]"
        options={{
          title: t("wordBank.wordsTitle"),
        }}
      />
    </Stack>
  );
}

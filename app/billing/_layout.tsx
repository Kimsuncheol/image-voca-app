import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function BillingLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("billing.title") }} />
      <Stack.Screen
        name="checkout"
        options={{ title: t("billing.checkout.title") }}
      />
    </Stack>
  );
}

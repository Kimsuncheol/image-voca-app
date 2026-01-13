import React from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { HelloWave } from "../hello-wave";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

export function WelcomeSection() {
  const { t } = useTranslation();
  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">{t("home.welcome")}</ThemedText>
      <HelloWave />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

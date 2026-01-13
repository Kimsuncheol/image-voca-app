import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

export function VocaHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <ThemedText type="title">{t("courses.vocabularyTitle")}</ThemedText>
      <ThemedText style={styles.subtitle}>
        {t("courses.selectCourse")}
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

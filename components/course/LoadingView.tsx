import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface LoadingViewProps {
  isDark: boolean;
}

export function LoadingView({ isDark }: LoadingViewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <ThemedText style={styles.loadingText}>{t("common.loading")}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
});

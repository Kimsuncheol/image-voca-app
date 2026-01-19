import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface WordArrangementTargetCardProps {
  word: string;
  meaning: string;
}

export function WordArrangementTargetCard({
  word,
  meaning,
}: WordArrangementTargetCardProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.targetCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <ThemedText style={styles.label}>
        {t("quiz.wordArrangement.targetWord")}
      </ThemedText>
      <ThemedText type="title" style={styles.word}>
        {word}
      </ThemedText>
      <ThemedText style={styles.meaning}>{meaning}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  targetCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  word: {
    fontSize: 32,
    fontWeight: "700",
    color: "#9B59B6",
  },
  meaning: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
});

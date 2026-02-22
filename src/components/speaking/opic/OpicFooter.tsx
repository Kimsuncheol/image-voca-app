import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../../components/themed-text";

interface OpicFooterProps {
  selectedTopicsCount: number;
  onStart: () => void;
  isDark: boolean;
}

export function OpicFooter({
  selectedTopicsCount,
  onStart,
  isDark,
}: OpicFooterProps) {
  const { t } = useTranslation();
  const hasSelection = selectedTopicsCount > 0;

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.startButton,
          {
            backgroundColor: hasSelection
              ? "#87CEEB"
              : isDark
                ? "#333"
                : "#ddd",
          },
        ]}
        onPress={onStart}
        disabled={!hasSelection}
      >
        <Ionicons name="play" size={20} color="#fff" />
        <ThemedText style={styles.startButtonText}>
          {hasSelection
            ? t("speaking.opic.startPractice", {
                count: selectedTopicsCount,
              })
            : t("speaking.opic.selectToStart")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 50,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface GameScoreProps {
  current: number;
  total: number;
  courseColor?: string;
  isDark: boolean;
}

export function GameScore({
  current,
  total,
  courseColor,
  isDark,
}: GameScoreProps) {
  return (
    <View style={styles.progressContainer}>
      <View
        style={[
          styles.progressBar,
          { backgroundColor: isDark ? "#333" : "#e0e0e0" },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${(current / total) * 100}%`,
              backgroundColor: courseColor || "#007AFF",
            },
          ]}
        />
      </View>
      <ThemedText style={styles.progressText}>
        {current} / {total}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },
});

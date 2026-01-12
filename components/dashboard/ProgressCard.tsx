import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
}

export function ProgressCard({ title, current, total, unit = "" }: ProgressCardProps) {
  const { isDark } = useTheme();
  const progress = total > 0 ? (current / total) * 100 : 0;
  const tintColor = Colors[isDark ? "dark" : "light"].tint;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText style={styles.stats}>
          {current}/{total} {unit}
        </ThemedText>
      </View>
      <View style={[styles.progressBg, { backgroundColor: isDark ? "#333" : "#ddd" }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: tintColor },
          ]}
        />
      </View>
      <ThemedText style={styles.percentage}>{Math.round(progress)}% complete</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stats: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
});

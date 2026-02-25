import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  isDark: boolean;
  onGoDashboard: () => void;
}

/**
 * Shown when no notification card payload is available.
 * Explains how to open a word notification and provides a shortcut to the dashboard.
 */
export default function EmptyState({ isDark, onGoDashboard }: EmptyStateProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
        },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#111827" }]}>
        No notification card data found
      </Text>

      <Text style={[styles.body, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        Open a word notification from your device notification center to view it
        here.
      </Text>

      <Pressable
        onPress={onGoDashboard}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: pressed ? "#3B82F6" : "#4A90E2" },
        ]}
      >
        <Text style={styles.ctaText}>Go to Dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

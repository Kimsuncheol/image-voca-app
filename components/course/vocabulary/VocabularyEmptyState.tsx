import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VocabularyEmptyStateProps {
  isDark: boolean;
}

export const VocabularyEmptyState: React.FC<VocabularyEmptyStateProps> = ({
  isDark,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons
        name="book-outline"
        size={48}
        color={isDark ? "#4B5563" : "#9CA3AF"}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: isDark ? "#F3F4F6" : "#111827" }]}>
        No words found
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        No words found for this day.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

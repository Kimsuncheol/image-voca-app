import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../themed-text";

interface MatchingCardProps {
  text: string;
  isMatched: boolean;
  isSelected: boolean;
  onPress: () => void;
  courseColor?: string;
  isDark: boolean;
}

export function MatchingCard({
  text,
  isMatched,
  isSelected,
  onPress,
  courseColor,
  isDark,
}: MatchingCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.matchingItem,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        isMatched && styles.matchingItemMatched,
        isSelected && styles.matchingItemSelected,
        isSelected && {
          borderColor: courseColor || "#007AFF",
          backgroundColor: (courseColor || "#007AFF") + "10",
        },
      ]}
      onPress={onPress}
      disabled={isMatched}
    >
      <ThemedText
        style={[
          styles.matchingItemText,
          isMatched && styles.matchingItemTextMatched,
          isSelected && { color: courseColor || "#007AFF" },
        ]}
      >
        {text}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  matchingItem: {
    // height: 70, // Removed fixed height
    aspectRatio: 1 / 0.6,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: "100%", // Ensure it takes full width of the column
  },
  matchingItemMatched: {
    borderColor: "#28a745",
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  matchingItemSelected: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  matchingItemText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  matchingItemTextMatched: {
    color: "#28a745",
    fontWeight: "700",
    opacity: 0.8,
  },
});

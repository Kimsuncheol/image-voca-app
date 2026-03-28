import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { ThemedText } from "../themed-text";

interface MatchingCardProps {
  text: string;
  pronunciation?: string;
  variant?: "word" | "meaning";
  isMatched: boolean;
  isSelected: boolean;
  onPress: () => void;
  courseColor?: string;
  isDark: boolean;
}

export function MatchingCard({
  text,
  pronunciation,
  variant = "word",
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
      <View style={styles.content}>
        {variant === "meaning" ? (
          <InlineMeaningWithChips
            meaning={text}
            isDark={isDark}
            textStyle={[
              styles.matchingItemText,
              styles.meaningText,
              isMatched && styles.matchingItemTextMatched,
              isSelected && { color: courseColor || "#007AFF" },
            ]}
            prefixStyle={[
              styles.matchingItemText,
              styles.meaningText,
              isMatched && styles.matchingItemTextMatched,
              isSelected && { color: courseColor || "#007AFF" },
            ]}
            containerStyle={styles.meaningContainer}
            lineStyle={styles.meaningLine}
            testID="matching-meaning"
          />
        ) : (
          <View style={styles.wordStack}>
            <ThemedText
              style={[
                styles.matchingItemText,
                styles.wordText,
                isMatched && styles.matchingItemTextMatched,
                isSelected && { color: courseColor || "#007AFF" },
              ]}
            >
              {text}
            </ThemedText>
            {pronunciation ? (
              <ThemedText
                style={[
                  styles.secondaryText,
                  isMatched && styles.matchingItemTextMatched,
                  isSelected && { color: courseColor || "#007AFF" },
                ]}
              >
                {pronunciation}
              </ThemedText>
            ) : null}
          </View>
        )}
      </View>
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
  content: {
    width: "100%",
  },
  matchingItemMatched: {
    borderColor: "#28a745",
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  matchingItemSelected: {
    borderWidth: 2,
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
  wordStack: {
    alignItems: "center",
    gap: 2,
  },
  wordText: {
    fontSize: 16,
    fontWeight: "700",
  },
  meaningContainer: {
    gap: 2,
  },
  meaningLine: {
    justifyContent: "center",
  },
  meaningText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  secondaryText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.8,
    lineHeight: 18,
  },
});

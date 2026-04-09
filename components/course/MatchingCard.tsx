import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";
import { ThemedText } from "../themed-text";

interface MatchingCardProps {
  text: string;
  pronunciation?: string;
  courseId?: string;
  variant?: "word" | "meaning" | "synonym" | "pronunciation";
  isMatched: boolean;
  isSelected: boolean;
  onPress: () => void;
  courseColor?: string;
  isDark: boolean;
}

export function MatchingCard({
  text,
  pronunciation,
  courseId,
  variant = "word",
  isMatched,
  isSelected,
  onPress,
  courseColor,
  isDark,
}: MatchingCardProps) {
  const wordFontSize = React.useMemo(
    () => getIdiomTitleFontSize(text, courseId, 16),
    [courseId, text],
  );
  const wordLineHeight = React.useMemo(
    () => Math.round(wordFontSize * 1.2),
    [wordFontSize],
  );

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
            courseId={courseId}
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
        ) : variant === "pronunciation" ? (
          <ThemedText
            style={[
              styles.matchingItemText,
              styles.pronunciationText,
              isMatched && styles.matchingItemTextMatched,
              isSelected && { color: courseColor || "#007AFF" },
            ]}
          >
            {text}
          </ThemedText>
        ) : variant === "synonym" ? (
          <ThemedText
            style={[
              styles.matchingItemText,
              styles.synonymText,
              isMatched && styles.matchingItemTextMatched,
              !isMatched && !isSelected && styles.synonymTextDefault,
              isSelected && { color: courseColor || "#007AFF" },
            ]}
          >
            {text}
          </ThemedText>
        ) : (
          <View style={styles.wordStack}>
            <ThemedText
              style={[
                styles.matchingItemText,
                styles.wordText,
                { fontSize: wordFontSize, lineHeight: wordLineHeight },
                isMatched && styles.matchingItemTextMatched,
                isSelected && { color: courseColor || "#007AFF" },
              ]}
            >
              {text}
            </ThemedText>
            {pronunciation ? (
              <ThemedText
                style={[
                  styles.pronunciationCaption,
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
  pronunciationText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  synonymText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "600",
  },
  synonymTextDefault: {
    color: "#9CA3AF",
  },
  pronunciationCaption: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    opacity: 0.75,
  },
});

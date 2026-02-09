import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ThemedText } from "../themed-text";
import { useTheme } from "../../src/context/ThemeContext";

interface WordCardExampleProps {
  example: string;
  translation?: string;
}

/**
 * Example section of the word card
 * Displays the example sentence and optional translation
 * Supports multiple examples with collapse/expand and TTS
 */
export function WordCardExample({
  example,
  translation,
}: WordCardExampleProps) {
  const { isDark } = useTheme();

  // Split examples and translations by newlines
  // Remove number prefixes (e.g., "1. ", "2. ") from the raw text
  const examples = example
    ? example.split("\n")
        .filter((e) => e.trim())
        .map((e) => e.replace(/^\d+\.\s*/, "").trim())
    : [];
  const translations = translation
    ? translation.split("\n")
        .filter((t) => t.trim())
        .map((t) => t.replace(/^\d+\.\s*/, "").trim())
    : [];

  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = examples.length >= 4;
  const displayedExamples = shouldCollapse && !isExpanded
    ? examples.slice(0, 3)
    : examples;

  // TTS handler with recycling (stop previous speech before starting new)
  const handleSpeak = async (text: string) => {
    try {
      // Stop any ongoing speech (TTS recycling)
      await Speech.stop();

      // Clean the text: remove quotes and trim
      const cleanText = text.replace(/^"|"$/g, "").trim();

      // Speak the cleaned text
      Speech.speak(cleanText, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.exampleContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {displayedExamples.map((exampleText, index) => (
          <View key={index} style={styles.exampleGroup}>
            <TouchableOpacity
              onPress={() => handleSpeak(exampleText.trim())}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.example}>
                {exampleText.trim()}
              </ThemedText>
            </TouchableOpacity>
            {translations[index] && (
              <ThemedText style={styles.translation}>
                {translations[index].trim()}
              </ThemedText>
            )}
          </View>
        ))}
      </ScrollView>

      {shouldCollapse && (
        <TouchableOpacity
          style={[
            styles.expandButton,
            { backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5" },
          ]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <ThemedText
            style={[
              styles.expandButtonText,
              { color: isDark ? "#0a84ff" : "#007AFF" },
            ]}
          >
            {isExpanded ? "Show less" : `Show ${examples.length - 3} more`}
          </ThemedText>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={isDark ? "#0a84ff" : "#007AFF"}
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
    maxHeight: 200,
  },
  exampleGroup: {
    marginTop: 8,
  },
  example: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.8,
    fontStyle: "italic",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

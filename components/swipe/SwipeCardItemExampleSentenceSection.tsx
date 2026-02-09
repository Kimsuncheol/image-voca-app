import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";

interface SwipeCardItemExampleSentenceSectionProps {
  example: string;
  translation?: string;
  isDark: boolean;
}

export function SwipeCardItemExampleSentenceSection({
  example,
  translation,
  isDark,
}: SwipeCardItemExampleSentenceSectionProps) {
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
        style={styles.examplesScrollContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {displayedExamples.map((exampleText, index) => (
          <View key={index} style={styles.exampleGroup}>
            <TouchableOpacity
              onPress={() => handleSpeak(exampleText.trim())}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cardExample,
                  { color: isDark ? "#b0b0b0" : "#444" },
                  { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
                ]}
                numberOfLines={2}
              >
                {exampleText.trim()}
              </Text>
            </TouchableOpacity>
            {translations[index] && (
              <Text
                style={[
                  styles.cardTranslation,
                  { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                  { borderLeftColor: isDark ? "#34c759" : "#28a745" },
                ]}
                numberOfLines={2}
              >
                {translations[index].trim()}
              </Text>
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
          <Text
            style={[
              styles.expandButtonText,
              { color: isDark ? "#0a84ff" : "#007AFF" },
            ]}
          >
            {isExpanded ? "Show less" : `Show ${examples.length - 3} more`}
          </Text>
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
  examplesScrollContainer: {
    maxHeight: 200,
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  cardExample: {
    fontSize: 14,
    color: "#444",
    fontStyle: "italic",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    lineHeight: 20,
  },
  cardTranslation: {
    fontSize: 15,
    color: "#2d5f2d",
    fontWeight: "500",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
    paddingLeft: 12,
    marginTop: 4,
    lineHeight: 22,
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

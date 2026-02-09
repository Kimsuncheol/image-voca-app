import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  const examples = example ? example.split("\n").filter((e) => e.trim()) : [];
  const translations = translation
    ? translation.split("\n").filter((t) => t.trim())
    : [];

  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = examples.length >= 4;
  const displayedExamples = shouldCollapse && !isExpanded
    ? examples.slice(0, 3)
    : examples;

  return (
    <>
      <ScrollView
        style={styles.examplesScrollContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {displayedExamples.map((exampleText, index) => (
          <View key={index} style={styles.exampleGroup}>
            <Text
              style={[
                styles.cardExample,
                { color: isDark ? "#b0b0b0" : "#444" },
                { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
              ]}
              numberOfLines={2}
            >
              {examples.length > 1 ? `${index + 1}. ` : ""}&quot;
              {exampleText.trim()}&quot;
            </Text>
            {translations[index] && (
              <Text
                style={[
                  styles.cardTranslation,
                  { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                  { borderLeftColor: isDark ? "#34c759" : "#28a745" },
                ]}
                numberOfLines={2}
              >
                {examples.length > 1 ? `${index + 1}. ` : ""}
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

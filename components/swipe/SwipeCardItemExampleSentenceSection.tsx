import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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

  return (
    <ScrollView
      style={styles.examplesScrollContainer}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
    >
      {examples.map((exampleText, index) => (
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
});

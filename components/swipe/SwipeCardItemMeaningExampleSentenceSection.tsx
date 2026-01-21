import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SwipeCardItemMeaningExampleSentenceSectionProps {
  word: string;
  pronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  isDark: boolean;
}

export function SwipeCardItemMeaningExampleSentenceSection({
  word,
  pronunciation,
  meaning,
  example,
  translation,
  isDark,
}: SwipeCardItemMeaningExampleSentenceSectionProps) {
  const speak = () => {
    Speech.speak(word);
  };

  // Split examples and translations by newlines
  const examples = example ? example.split("\n").filter((e) => e.trim()) : [];
  const translations = translation
    ? translation.split("\n").filter((t) => t.trim())
    : [];

  return (
    <>
      {/* Word & Meaning Section */}
      <View style={styles.titleContainer}>
        <Text
          style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
        >
          {word}
        </Text>
        <TouchableOpacity
          onPress={speak}
          style={[
            styles.speakerButton,
            { backgroundColor: isDark ? "#2c2c2c" : "#F5F5F5" },
          ]}
        >
          <Ionicons
            name="volume-medium"
            size={24}
            color={isDark ? "#aaa" : "#666"}
          />
        </TouchableOpacity>
      </View>
      {pronunciation && (
        <Text
          style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
        >
          {pronunciation}
        </Text>
      )}
      <Text
        style={[
          styles.cardDescription,
          { color: isDark ? "#e0e0e0" : "#2c2c2c" },
        ]}
        numberOfLines={2}
      >
        {meaning}
      </Text>

      {/* Example Sentence Section - Scrollable */}
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
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  speakerButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 17,
    color: "#2c2c2c",
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: "500",
  },
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

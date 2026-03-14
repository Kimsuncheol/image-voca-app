import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { ThemedText } from "../themed-text";

interface WordCardExampleProps {
  example: string;
  translation?: string;
}

/**
 * Example section of the word card
 * Displays example sentences and translations with TTS support
 */
export function WordCardExample({ example, translation }: WordCardExampleProps) {
  const { speak } = useSpeech();

  const examples = example
    ? example
        .split("\n")
        .filter((e) => e.trim())
        .map((e) => e.replace(/^\d+\.\s*/, "").trim())
    : [];
  const translations = translation
    ? translation
        .split("\n")
        .filter((t) => t.trim())
        .map((t) => t.replace(/^\d+\.\s*/, "").trim())
    : [];

  const handleSpeak = async (text: string) => {
    try {
      await speak(text, { language: "en-US", pitch: 1.0, rate: 0.9 });
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  return (
    <View testID="word-card-example-content" style={styles.container}>
      {examples.map((exampleText, index) => (
        <View key={index} style={styles.exampleGroup}>
          <TouchableOpacity
            onPress={() => handleSpeak(exampleText.trim())}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.example}>{exampleText.trim()}</ThemedText>
          </TouchableOpacity>
          {translations[index] && (
            <ThemedText style={styles.translation}>
              {translations[index].trim()}
            </ThemedText>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  example: {
    fontSize: 16,
    opacity: 0.8,
  },
  translation: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.8,
  },
});

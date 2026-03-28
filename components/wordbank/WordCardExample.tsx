import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { ThemedText } from "../themed-text";

interface WordCardExampleProps {
  example: string;
  translation?: string;
  pronunciation?: string;
  speakLanguage?: string;
}

/**
 * Example section of the word card
 * Displays example sentences and translations with TTS support
 */
export function WordCardExample({
  example,
  translation,
  pronunciation,
  speakLanguage = "en-US",
}: WordCardExampleProps) {
  const { speak } = useSpeech();
  const { t } = useTranslation();

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
      await speak(text, { language: speakLanguage, pitch: 1.0, rate: 0.9 });
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  return (
    <View testID="word-card-example-content" style={styles.container}>
      {pronunciation ? (
        <ThemedText style={styles.metaText}>
          {`${t("notifications.labels.pronunciation", {
            defaultValue: "Pronunciation",
          })}: ${pronunciation}`}
        </ThemedText>
      ) : null}
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
  metaText: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.72,
    marginTop: 6,
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

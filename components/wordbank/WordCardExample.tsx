import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import { formatSynonyms } from "../../src/utils/synonyms";
import { ThemedText } from "../themed-text";

interface WordCardExampleProps {
  example: string;
  exampleHurigana?: string;
  translation?: string;
  synonyms?: string[];
  pronunciation?: string;
  course?: string;
  isDark?: boolean;
  speakLanguage?: string;
}

/**
 * Example section of the word card
 * Displays example sentences and translations with TTS support
 */
export function WordCardExample({
  example,
  exampleHurigana,
  translation,
  synonyms,
  pronunciation,
  course,
  isDark = false,
  speakLanguage = "en-US",
}: WordCardExampleProps) {
  const { speak } = useSpeech();
  useCardSpeechCleanup();
  const { t } = useTranslation();

  const examples = example
    ? example
        .split("\n")
        .filter((e) => e.trim())
        .map((e) => e.replace(/^\d+\.\s*/, "").trim())
    : [];
  const huriganaLines = exampleHurigana
    ? exampleHurigana
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
  const formattedSynonyms =
    course === "TOEFL_IELTS" ? formatSynonyms(synonyms) : undefined;

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
            onPress={() => handleSpeak((huriganaLines[index] ?? exampleText).trim())}
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
      {formattedSynonyms ? (
        <View testID="word-card-synonyms-section" style={styles.exampleGroup}>
          <ThemedText style={styles.metaText}>
            {`${t("notifications.labels.synonyms", {
              defaultValue: "Synonyms",
            })}:`}
          </ThemedText>
          <ThemedText
            testID="word-card-synonyms"
            style={[
              styles.synonyms,
              { color: isDark ? "#BDBDBD" : "#2F2F2F" },
            ]}
          >
            {formattedSynonyms}
          </ThemedText>
        </View>
      ) : null}
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
  synonyms: {
    fontSize: 15,
    lineHeight: 19,
    marginTop: 4,
  },
});

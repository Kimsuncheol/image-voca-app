import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { useSpeech } from "../../src/hooks/useSpeech";
import { useTranslation } from "react-i18next";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
import type { VocabularyLocalizationMap } from "../../src/types/vocabulary";
import { WordCardExample } from "./WordCardExample";
import { WordCardHeader } from "./WordCardHeader";
import { WordCardMeaning } from "./WordCardMeaning";

/**
 * SavedWord type definition
 * Represents a word saved to the user's word bank
 */
export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  translation?: string;
  pronunciation: string;
  pronunciationRoman?: string;
  example: string;
  course: string;
  day?: number;
  addedAt: string;
  imageUrl?: string;
  localized?: VocabularyLocalizationMap;
}

interface WordCardProps {
  word: SavedWord;
  courseColor?: string;
  isDark: boolean;
  showPronunciation?: boolean;
}

/**
 * Main WordCard component
 * Displays a saved word with all its information in a card format
 * Composed of smaller sub-components for better maintainability
 */
export function WordCard({
  word,
  isDark,
  showPronunciation = true,
}: WordCardProps) {
  const { speak } = useSpeech();
  const { i18n } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const speakLanguage = learningLanguage === "ja" ? "ja-JP" : "en-US";
  const resolved = React.useMemo(
    () => resolveVocabularyContent(word, i18n.language),
    [i18n.language, word],
  );

  const handleSpeakWord = React.useCallback(async () => {
    try {
      await speakWordVariants(word.word, speak);
    } catch (error) {
      console.error("Word card TTS error:", error);
    }
  }, [speak, word.word]);

  return (
    <View
      testID={`word-card-${word.id}`}
      style={[
        styles.wordCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.topLeft}>
          <WordCardHeader
            word={word.word}
            day={word.day}
            pronunciation={
              showPronunciation ? resolved.sharedPronunciation : undefined
            }
            onSpeak={handleSpeakWord}
          />
          <WordCardMeaning meaning={resolved.meaning} isDark={isDark} />
        </View>
        {resolved.imageUrl ? (
          <Image
            source={{ uri: resolved.imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <ImagePlaceholder isDark={isDark} style={styles.cardImage} />
        )}
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? "#333" : "#e0e0e0" },
        ]}
      />

      <WordCardExample
        example={resolved.example}
        translation={resolved.translation}
        pronunciation={
          resolved.localizedPronunciation !== resolved.sharedPronunciation
            ? resolved.localizedPronunciation
            : undefined
        }
        speakLanguage={speakLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  topLeft: {
    flex: 1,
  },
  cardImage: {
    width: 90,
    aspectRatio: 1,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});

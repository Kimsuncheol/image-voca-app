import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
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
  synonyms?: string[];
  pronunciation: string;
  pronunciationRoman?: string;
  example: string;
  exampleFurigana?: string;
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
  expandExampleToContent?: boolean;
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
  expandExampleToContent = false,
}: WordCardProps) {
  const { speak } = useSpeech();
  useCardSpeechCleanup();
  const { i18n } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const speakLanguage = learningLanguage === "ja" ? "ja-JP" : "en-US";
  const resolved = React.useMemo(
    () => resolveVocabularyContent(word, i18n.language),
    [i18n.language, word],
  );
  React.useEffect(() => {
    console.log("[WordCard] fields", {
      image: resolved.imageUrl ?? "(none)",
      word: resolved.word,
      pronunciation: resolved.sharedPronunciation ?? "(none)",
      meaning: resolved.meaning,
      example: resolved.example || "(none)",
      exampleFurigana: resolved.exampleFurigana ?? "(none)",
      translation: resolved.translation ?? "(none)",
    });
  }, [
    resolved.example,
    resolved.exampleFurigana,
    resolved.imageUrl,
    resolved.meaning,
    resolved.sharedPronunciation,
    resolved.translation,
    resolved.word,
  ]);

  const handleSpeakWord = React.useCallback(async () => {
    try {
      const textToSpeak = learningLanguage === "ja"
        ? (resolved.sharedPronunciation ?? word.word)
        : word.word;
      await speakWordVariants(textToSpeak, speak, {
        language: speakLanguage,
      });
    } catch (error) {
      console.error("Word card TTS error:", error);
    }
  }, [speak, word.word, learningLanguage, resolved.sharedPronunciation, speakLanguage]);

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
            courseId={word.course}
            day={word.day}
            pronunciation={
              showPronunciation ? resolved.sharedPronunciation : undefined
            }
            onSpeak={handleSpeakWord}
          />
          <WordCardMeaning
            meaning={resolved.meaning}
            courseId={word.course}
            isDark={isDark}
          />
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
        exampleFurigana={resolved.exampleFurigana}
        translation={resolved.translation}
        synonyms={word.synonyms}
        pronunciation={
          resolved.localizedPronunciation !== resolved.sharedPronunciation
            ? resolved.localizedPronunciation
            : undefined
        }
        course={word.course}
        isDark={isDark}
        speakLanguage={speakLanguage}
        expandToContent={expandExampleToContent}
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

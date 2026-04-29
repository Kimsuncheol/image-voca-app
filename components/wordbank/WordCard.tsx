import { FontWeights } from "@/constants/fontWeights";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import { FontSizes } from "@/constants/fontSizes";
import type {
  KanjiNestedListGroup,
  VocabularyLocalizationMap,
} from "../../src/types/vocabulary";
import { isJlptCourseId, isKanjiWord } from "../../src/types/vocabulary";
import { KanjiWordBankCard } from "./KanjiWordBankCard";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import { WordCardExample } from "./WordCardExample";
import { WordCardHeader } from "./WordCardHeader";
import { WordCardMeaning } from "./WordCardMeaning";

/**
 * SavedWord type definition
 * Represents a word saved to the user's word bank
 */
export interface SavedWord {
  id: string;
  word?: string;
  meaning?: string | string[];
  translation?: string;
  synonyms?: string[];
  pronunciation?: string;
  pronunciationRoman?: string;
  example?: string | string[];
  exampleFurigana?: string;
  kanji?: string;
  meaningKorean?: string[];
  meaningKoreanRomanize?: string[];
  meaningExample?: KanjiNestedListGroup[];
  meaningExampleHurigana?: KanjiNestedListGroup[];
  meaningEnglishTranslation?: KanjiNestedListGroup[];
  meaningKoreanTranslation?: KanjiNestedListGroup[];
  reading?: string[];
  readingKorean?: string[];
  readingKoreanRomanize?: string[];
  readingExample?: KanjiNestedListGroup[];
  readingExampleHurigana?: KanjiNestedListGroup[];
  readingEnglishTranslation?: KanjiNestedListGroup[];
  readingKoreanTranslation?: KanjiNestedListGroup[];
  exampleEnglishTranslation?: string[];
  exampleKoreanTranslation?: string[];
  exampleHurigana?: string[];
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
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

/**
 * Main WordCard component
 * Displays a saved word with all its information in a card format
 * Composed of smaller sub-components for better maintainability
 */
export function WordCard(props: WordCardProps) {
  if (isKanjiWord(props.word)) {
    return (
      <KanjiWordBankCard
        word={props.word}
        isDark={props.isDark}
        onSavedWordChange={props.onSavedWordChange}
      />
    );
  }
  return <StandardWordCard {...props} />;
}

function StandardWordCard({
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
  const [showKana, setShowKana] = React.useState(false);
  const resolved = React.useMemo(
    () =>
      resolveVocabularyContent(
        {
          word: word.word ?? "",
          meaning:
            typeof word.meaning === "string"
              ? word.meaning
              : (word.meaning ?? []).join("; "),
          translation: word.translation,
          pronunciation: word.pronunciation,
          pronunciationRoman: word.pronunciationRoman,
          example:
            typeof word.example === "string"
              ? word.example
              : (word.example ?? []).join("\n"),
          exampleFurigana: word.exampleFurigana,
          imageUrl: word.imageUrl,
          localized: word.localized,
        },
        i18n.language,
      ),
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

  const hasFurigana =
    isJlptCourseId(word.course) &&
    resolved.exampleFurigana !== resolved.example;

  const handleSpeakWord = React.useCallback(async () => {
    try {
      const textToSpeak = learningLanguage === "ja"
        ? (resolved.sharedPronunciation ?? word.word ?? "")
        : word.word ?? "";
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
            word={word.word ?? ""}
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
            hasPronunciation={
              showPronunciation && Boolean(resolved.sharedPronunciation)
            }
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
        showKana={showKana}
      />

      {hasFurigana ? (
        <View style={styles.kanaToggleBar}>
          <Pressable
            onPress={() => setShowKana((prev) => !prev)}
            style={[
              styles.kanaTogglePill,
              showKana && styles.kanaTogglePillActive,
              {
                borderColor: showKana
                  ? "rgba(46, 160, 67, 0.95)"
                  : isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(17,24,28,0.16)",
              },
            ]}
          >
            <Text
              style={[
                styles.kanaToggleText,
                { color: showKana ? "#FFFFFF" : isDark ? "#8e8e93" : "#666" },
              ]}
            >
              がな
            </Text>
          </Pressable>
        </View>
      ) : null}
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
  kanaToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  kanaTogglePill: {
    minHeight: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  kanaTogglePillActive: {
    backgroundColor: "#2EA043",
  },
  kanaToggleText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.5,
  },
});

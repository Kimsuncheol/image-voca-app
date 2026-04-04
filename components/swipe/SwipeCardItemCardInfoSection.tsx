import React from "react";
import { StyleSheet, View } from "react-native";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemMeaningExampleSentenceSection } from "./SwipeCardItemMeaningExampleSentenceSection";

interface CardInfoSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  localizedPronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  synonyms?: string[];
  courseId: string;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

export function SwipeCardItemCardInfoSection({
  item,
  word,
  pronunciation,
  localizedPronunciation,
  meaning,
  example,
  translation,
  synonyms,
  courseId,
  isDark,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: CardInfoSectionProps) {
  return (
    <View
      style={[
        styles.cardInfo,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
      ]}
    >
      {/* Merged Word, Meaning & Example Section */}
      <SwipeCardItemMeaningExampleSentenceSection
        item={item}
        word={word}
        pronunciation={pronunciation}
        localizedPronunciation={localizedPronunciation}

        meaning={meaning}
        example={example}
        translation={translation}
        synonyms={synonyms}
        courseId={courseId}
        isDark={isDark}
        initialIsSaved={initialIsSaved}
        day={day}
        onSavedWordChange={onSavedWordChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    height: "65%",
    justifyContent: "flex-start",
    padding: 24,
    backgroundColor: "#fff",
  },
});

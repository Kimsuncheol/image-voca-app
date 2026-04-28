import React from "react";
import { StyleSheet, View } from "react-native";
import { VocabularyCard } from "../../src/types/vocabulary";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";
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
  isActive?: boolean;
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
  isActive = true,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: CardInfoSectionProps) {
  return (
    <View
      style={[
        styles.cardInfo,
        { backgroundColor: blackCardColors.surface },
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
        isActive={isActive}
        initialIsSaved={initialIsSaved}
        day={day}
        onSavedWordChange={onSavedWordChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardInfo: {
    height: "62%",
    justifyContent: "flex-start",
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: blackCardColors.surface,
  },
});

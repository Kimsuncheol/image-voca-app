import React from "react";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemExampleSentenceSection } from "./SwipeCardItemExampleSentenceSection";
import { SwipeCardItemWordMeaningSection } from "./SwipeCardItemWordMeaningSection";

interface SwipeCardItemMeaningExampleSentenceSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  localizedPronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

export function SwipeCardItemMeaningExampleSentenceSection({
  item,
  word,
  pronunciation,
  localizedPronunciation,
  meaning,
  example,
  translation,
  isDark,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: SwipeCardItemMeaningExampleSentenceSectionProps) {
  return (
    <>
      <SwipeCardItemWordMeaningSection
        item={item}
        word={word}
        pronunciation={pronunciation}
        meaning={meaning}
        isDark={isDark}
        initialIsSaved={initialIsSaved}
        day={day}
        onSavedWordChange={onSavedWordChange}
      />
      <SwipeCardItemExampleSentenceSection
        example={example}
        translation={translation}
        pronunciation={localizedPronunciation}

        isDark={isDark}
      />
    </>
  );
}

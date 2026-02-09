import React from "react";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemExampleSentenceSection } from "./SwipeCardItemExampleSentenceSection";
import { SwipeCardItemWordMeaningSection } from "./SwipeCardItemWordMeaningSection";

interface SwipeCardItemMeaningExampleSentenceSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItemMeaningExampleSentenceSection({
  item,
  word,
  pronunciation,
  meaning,
  example,
  translation,
  isDark,
  initialIsSaved = false,
  day,
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
      />
      <SwipeCardItemExampleSentenceSection
        example={example}
        translation={translation}
        isDark={isDark}
      />
    </>
  );
}

import React from "react";
import { SwipeCardItemExampleSentenceSection } from "./SwipeCardItemExampleSentenceSection";
import { SwipeCardItemWordMeaningSection } from "./SwipeCardItemWordMeaningSection";

interface SwipeCardItemMeaningExampleSentenceSectionProps {
  word: string;
  pronunciation?: string;
  meaning: string;
  example: string;
  translation?: string;
  isDark: boolean;
}

export function SwipeCardItemMeaningExampleSentenceSection({
  word,
  pronunciation,
  meaning,
  example,
  translation,
  isDark,
}: SwipeCardItemMeaningExampleSentenceSectionProps) {
  return (
    <>
      <SwipeCardItemWordMeaningSection
        word={word}
        pronunciation={pronunciation}
        meaning={meaning}
        isDark={isDark}
      />
      <SwipeCardItemExampleSentenceSection
        example={example}
        translation={translation}
        isDark={isDark}
      />
    </>
  );
}

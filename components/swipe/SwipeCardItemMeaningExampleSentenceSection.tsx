import React from "react";
import type { ReviewMaskTarget } from "../../src/services/speechPreferences";
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
  synonyms?: string[];
  courseId: string;
  isDark: boolean;
  isActive?: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
}

export function SwipeCardItemMeaningExampleSentenceSection({
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
  isPreviewMode = false,
  isReviewMode = false,
  reviewMaskTarget = "word",
}: SwipeCardItemMeaningExampleSentenceSectionProps) {
  return (
    <>
      <SwipeCardItemWordMeaningSection
        item={item}
        word={word}
        pronunciation={pronunciation}
        meaning={meaning}
        isDark={isDark}
        isActive={isActive}
        initialIsSaved={initialIsSaved}
        day={day}
        onSavedWordChange={onSavedWordChange}
        isPreviewMode={isPreviewMode}
        isReviewMode={isReviewMode}
        reviewMaskTarget={reviewMaskTarget}
      />
      <SwipeCardItemExampleSentenceSection
        example={example}
        translation={translation}
        pronunciation={localizedPronunciation}
        synonyms={synonyms}
        courseId={courseId}
        isDark={isDark}
        isActive={isActive}
        isReviewMode={isReviewMode}
        reviewMaskTarget={reviewMaskTarget}
      />
    </>
  );
}

import React from "react";
import {
  CourseVocabularyCard,
  VocabularyCard,
  isKanjiWord,
} from "../../src/types/vocabulary";
import type { SavedWord } from "../wordbank/WordCard";
import { AddToWordBankButton } from "../wordbank/AddToWordBankButton";

interface SwipeCardItemAddToWordBankButtonProps {
  item: CourseVocabularyCard;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

export function SwipeCardItemAddToWordBankButton({
  item,
  isDark,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: SwipeCardItemAddToWordBankButtonProps) {
  const course = isKanjiWord(item) ? "KANJI" : item.course;

  return (
    <AddToWordBankButton
      itemId={item.id}
      course={course}
      isDark={isDark}
      initialIsSaved={initialIsSaved}
      onSavedStateChange={onSavedWordChange}
      testIDPrefix="swipe-card-add-to-wordbank"
      variant="bookmark"
      buildSavedWord={() => {
        if (isKanjiWord(item)) {
          return {
            ...item,
            course,
            day,
            addedAt: new Date().toISOString(),
          } as SavedWord;
        }

        const vocabularyItem = item as VocabularyCard;
        return {
          id: vocabularyItem.id,
          word: vocabularyItem.word,
          meaning: vocabularyItem.meaning,
          translation: vocabularyItem.translation || "",
          synonyms: vocabularyItem.synonyms,
          pronunciation: vocabularyItem.pronunciation || "",
          pronunciationRoman: vocabularyItem.pronunciationRoman,
          example: vocabularyItem.example,
          exampleFurigana:
            vocabularyItem.exampleFurigana ?? vocabularyItem.exampleHurigana,
          exampleHurigana: vocabularyItem.exampleHurigana,
          course: vocabularyItem.course,
          day,
          addedAt: new Date().toISOString(),
          imageUrl: vocabularyItem.imageUrl,
          localized: vocabularyItem.localized,
        } as SavedWord;
      }}
    />
  );
}

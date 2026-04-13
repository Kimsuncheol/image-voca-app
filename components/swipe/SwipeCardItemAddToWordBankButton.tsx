import React from "react";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SavedWord } from "../wordbank/WordCard";
import { AddToWordBankButton } from "../wordbank/AddToWordBankButton";

interface SwipeCardItemAddToWordBankButtonProps {
  item: VocabularyCard;
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
  return (
    <AddToWordBankButton
      itemId={item.id}
      course={item.course}
      isDark={isDark}
      initialIsSaved={initialIsSaved}
      onSavedStateChange={onSavedWordChange}
      testIDPrefix="swipe-card-add-to-wordbank"
      variant="star"
      buildSavedWord={() =>
        ({
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          translation: item.translation || "",
          synonyms: item.synonyms,
          pronunciation: item.pronunciation || "",
          pronunciationRoman: item.pronunciationRoman,
          example: item.example,
          exampleHurigana: item.exampleHurigana,
          course: item.course,
          day,
          addedAt: new Date().toISOString(),
          imageUrl: item.imageUrl,
          localized: item.localized,
        }) as SavedWord
      }
    />
  );
}

import React from "react";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { CarouselSwipeDeck } from "./CarouselSwipeDeck";
import { JlptVocabularyCard } from "./JlptVocabularyCard";

interface JlptSwipeDeckProps {
  cards: VocabularyCard[];
  dayNumber: number;
  savedWordIds: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
}

export const JlptSwipeDeck: React.FC<JlptSwipeDeckProps> = (props) => {
  const renderJlptCard = React.useCallback(
    ({
      item,
      isSaved,
      dayNumber,
      onSavedWordChange,
    }: {
      item: VocabularyCard;
      isSaved: boolean;
      dayNumber: number;
      onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
    }) => (
      <JlptVocabularyCard
        item={item}
        initialIsSaved={isSaved}
        day={dayNumber}
        onSavedWordChange={onSavedWordChange}
      />
    ),
    [],
  );

  return <CarouselSwipeDeck {...props} renderCard={renderJlptCard} />;
};

import React from "react";
import { stopAllCardSpeech } from "../../../src/hooks/useCardSpeechCleanup";
import { KanjiWord } from "../../../src/types/vocabulary";
import { CarouselSwipeDeck } from "./CarouselSwipeDeck";
import { KanjiCollocationCard } from "./KanjiCollocationCard";

interface KanjiSwipeDeckProps {
  cards: KanjiWord[];
  dayNumber: number;
  savedWordIds: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onSwipeRight: (item: KanjiWord) => void;
  onSwipeLeft: (item: KanjiWord) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
}

export const KanjiSwipeDeck: React.FC<KanjiSwipeDeckProps> = (props) => {
  const renderKanjiCard = React.useCallback(
    ({
      item,
      isSaved,
      isActive,
      dayNumber,
      onSavedWordChange,
    }: {
      item: KanjiWord;
      isSaved: boolean;
      isActive: boolean;
      dayNumber: number;
      onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
    }) => (
      <KanjiCollocationCard
        item={item}
        initialIsSaved={isSaved}
        day={dayNumber}
        isActive={isActive}
        onSavedWordChange={onSavedWordChange}
      />
    ),
    [],
  );

  return (
    <CarouselSwipeDeck
      {...props}
      renderCard={renderKanjiCard}
      onSwipeStart={stopAllCardSpeech}
    />
  );
};

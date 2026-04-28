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
  initialIndex?: number;
  isPreviewMode?: boolean;
}

export const KanjiSwipeDeck: React.FC<KanjiSwipeDeckProps> = (props) => {
  const renderKanjiCard = React.useCallback(
    ({
      item,
      isSaved,
      isActive,
      dayNumber,
      isPreviewMode,
      onSavedWordChange,
    }: {
      item: KanjiWord;
      isSaved: boolean;
      isActive: boolean;
      dayNumber: number;
      isPreviewMode: boolean;
      onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
    }) => (
      <KanjiCollocationCard
        item={item}
        initialIsSaved={isPreviewMode ? false : isSaved}
        day={dayNumber}
        isActive={isActive}
        onSavedWordChange={isPreviewMode ? undefined : onSavedWordChange}
        isPreviewMode={isPreviewMode}
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

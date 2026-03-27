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

interface JlptDeckCardProps {
  item: VocabularyCard;
  initialIsSaved: boolean;
  dayNumber: number;
  deckKey: string;
  kanaStateCacheRef: React.MutableRefObject<Record<string, boolean>>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

const JlptDeckCard = React.memo(function JlptDeckCard({
  item,
  initialIsSaved,
  dayNumber,
  deckKey,
  kanaStateCacheRef,
  onSavedWordChange,
}: JlptDeckCardProps) {
  const [showKana, setShowKana] = React.useState(
    () => Boolean(kanaStateCacheRef.current[item.id]),
  );

  const handleToggleKana = React.useCallback(() => {
    setShowKana((current) => {
      const next = !current;
      kanaStateCacheRef.current[item.id] = next;
      return next;
    });
  }, [item.id, kanaStateCacheRef]);

  return (
    <JlptVocabularyCard
      key={`${deckKey}:${item.id}`}
      item={item}
      initialIsSaved={initialIsSaved}
      day={dayNumber}
      onSavedWordChange={onSavedWordChange}
      showKana={showKana}
      onToggleKana={handleToggleKana}
    />
  );
});

export const JlptSwipeDeck: React.FC<JlptSwipeDeckProps> = (props) => {
  const cardIdsKey = React.useMemo(
    () => props.cards.map((card) => card.id).join("|"),
    [props.cards],
  );
  const kanaStateCacheRef = React.useRef<Record<string, boolean>>({});
  const previousDeckKeyRef = React.useRef(cardIdsKey);

  if (previousDeckKeyRef.current !== cardIdsKey) {
    kanaStateCacheRef.current = {};
    previousDeckKeyRef.current = cardIdsKey;
  }

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
      <JlptDeckCard
        key={`${cardIdsKey}:${item.id}`}
        item={item}
        initialIsSaved={isSaved}
        dayNumber={dayNumber}
        deckKey={cardIdsKey}
        kanaStateCacheRef={kanaStateCacheRef}
        onSavedWordChange={onSavedWordChange}
      />
    ),
    [cardIdsKey],
  );

  return <CarouselSwipeDeck {...props} renderCard={renderJlptCard} />;
};

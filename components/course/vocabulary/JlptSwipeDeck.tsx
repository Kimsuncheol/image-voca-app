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
  initialIndex?: number;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
}

interface JlptDeckCardProps {
  item: VocabularyCard;
  initialIsSaved: boolean;
  dayNumber: number;
  isActive: boolean;
  deckKey: string;
  kanaStateCacheRef: React.MutableRefObject<Record<string, boolean>>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode: boolean;
  isReviewMode: boolean;
}

const JlptDeckCard = React.memo(function JlptDeckCard({
  item,
  initialIsSaved,
  dayNumber,
  isActive,
  deckKey,
  kanaStateCacheRef,
  onSavedWordChange,
  isPreviewMode,
  isReviewMode,
}: JlptDeckCardProps) {
  const [showKana, setShowKana] = React.useState(
    () => Boolean(kanaStateCacheRef.current[item.id]),
  );

  React.useEffect(() => {
    if (!isActive) {
      kanaStateCacheRef.current[item.id] = false;
      setShowKana(false);
    }
  }, [isActive, item.id, kanaStateCacheRef]);

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
      isActive={isActive}
      onSavedWordChange={isPreviewMode ? undefined : onSavedWordChange}
      isPreviewMode={isPreviewMode}
      isReviewMode={isReviewMode}
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
      isActive,
      dayNumber,
      isPreviewMode,
      isReviewMode,
      onSavedWordChange,
    }: {
      item: VocabularyCard;
      isSaved: boolean;
      isActive: boolean;
      dayNumber: number;
      isPreviewMode: boolean;
      isReviewMode: boolean;
      onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
    }) => (
      <JlptDeckCard
        key={`${cardIdsKey}:${item.id}`}
        item={item}
        initialIsSaved={isPreviewMode ? false : isSaved}
        dayNumber={dayNumber}
        isActive={isActive}
        deckKey={cardIdsKey}
        kanaStateCacheRef={kanaStateCacheRef}
        onSavedWordChange={onSavedWordChange}
        isPreviewMode={isPreviewMode}
        isReviewMode={isReviewMode}
      />
    ),
    [cardIdsKey],
  );

  return <CarouselSwipeDeck {...props} renderCard={renderJlptCard} />;
};

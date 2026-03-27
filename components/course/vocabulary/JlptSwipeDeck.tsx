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
  const [showKanaByCardId, setShowKanaByCardId] = React.useState<
    Record<string, boolean>
  >({});
  const cardIdsKey = React.useMemo(
    () => props.cards.map((card) => card.id).join("|"),
    [props.cards],
  );

  React.useEffect(() => {
    setShowKanaByCardId({});
  }, [cardIdsKey]);

  const handleToggleKana = React.useCallback((cardId: string) => {
    setShowKanaByCardId((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }));
  }, []);

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
        showKana={Boolean(showKanaByCardId[item.id])}
        onToggleKana={() => handleToggleKana(item.id)}
      />
    ),
    [handleToggleKana, showKanaByCardId],
  );

  return <CarouselSwipeDeck {...props} renderCard={renderJlptCard} />;
};

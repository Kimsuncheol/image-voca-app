import React, { useRef } from "react";
import {
  TinderSwipe,
  TinderSwipeRef,
} from "../../../src/components/tinder-swipe/TinderSwipe";
import { CourseType, VocabularyCard } from "../../../src/types/vocabulary";
import { CollocationSwipeable } from "../../CollocationFlipCard/CollocationSwipeable";
import { SwipeCardItem } from "../../swipe/SwipeCardItem";

interface VocabularySwipeDeckProps {
  cards: VocabularyCard[];
  courseId: CourseType;
  isDark: boolean;
  dayNumber: number;
  savedWordIds: Set<string>;
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  renderFinishView?: () => React.ReactNode;
}

export const VocabularySwipeDeck: React.FC<VocabularySwipeDeckProps> = ({
  cards,
  courseId,
  isDark,
  dayNumber,
  savedWordIds,
  onSwipeRight,
  onSwipeLeft,
  onIndexChange,
  onFinish,
  renderFinishView,
}) => {
  const swipeRef = useRef<TinderSwipeRef>(null);

  if (courseId === "COLLOCATION") {
    return (
      <CollocationSwipeable
        data={cards}
        isDark={isDark}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        renderFinalPage={renderFinishView}
        day={dayNumber}
        savedWordIds={savedWordIds}
      />
    );
  }

  return (
    <TinderSwipe
      ref={swipeRef}
      data={cards}
      renderCard={(item) => (
        <SwipeCardItem
          item={item}
          initialIsSaved={savedWordIds.has(item.id)}
          day={dayNumber}
        />
      )}
      onSwipeRight={onSwipeRight}
      onSwipeLeft={onSwipeLeft}
      loop={false}
      onRunOutOfCards={onFinish}
      swipeLeftMode="rewind"
    />
  );
};

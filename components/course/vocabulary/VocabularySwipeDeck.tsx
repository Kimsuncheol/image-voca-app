import React from "react";
import { CourseType, VocabularyCard, isJlptLevelCourseId } from "../../../src/types/vocabulary";
import { CollocationSwipeable } from "../../CollocationFlipCard/CollocationSwipeable";
import { CarouselSwipeDeck } from "./CarouselSwipeDeck";
import { JlptSwipeDeck } from "./JlptSwipeDeck";

interface VocabularySwipeDeckProps {
  cards: VocabularyCard[];
  courseId: CourseType;
  isDark: boolean;
  dayNumber: number;
  savedWordIds: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  renderFinishView?: () => React.ReactNode;
  isStudyCompleted?: boolean;
}

export const VocabularySwipeDeck: React.FC<VocabularySwipeDeckProps> = ({
  cards,
  courseId,
  isDark,
  dayNumber,
  savedWordIds,
  onSavedWordChange,
  onSwipeRight,
  onSwipeLeft,
  onIndexChange,
  onFinish,
  renderFinishView,
  isStudyCompleted,
}) => {
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
        onSavedWordChange={onSavedWordChange}
        isStudyCompleted={isStudyCompleted}
      />
    );
  }

  if (isJlptLevelCourseId(courseId)) {
    return (
      <JlptSwipeDeck
        cards={cards}
        dayNumber={dayNumber}
        savedWordIds={savedWordIds}
        onSavedWordChange={onSavedWordChange}
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
      />
    );
  }

  return (
    <CarouselSwipeDeck
      cards={cards}
      dayNumber={dayNumber}
      savedWordIds={savedWordIds}
      onSavedWordChange={onSavedWordChange}
      onSwipeRight={onSwipeRight}
      onSwipeLeft={onSwipeLeft}
      onIndexChange={onIndexChange}
      onFinish={onFinish}
    />
  );
};

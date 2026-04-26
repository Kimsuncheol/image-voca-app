import React from "react";
import {
  CourseType,
  CourseVocabularyCard,
  KanjiWord,
  VocabularyCard,
  isJlptLevelCourseId,
  isKanjiWord,
} from "../../../src/types/vocabulary";
import { CollocationSwipeable } from "../../CollocationFlipCard/CollocationSwipeable";
import { CarouselSwipeDeck } from "./CarouselSwipeDeck";
import { JlptSwipeDeck } from "./JlptSwipeDeck";
import { KanjiSwipeDeck } from "./KanjiSwipeDeck";

interface VocabularySwipeDeckProps {
  cards: CourseVocabularyCard[];
  courseId: CourseType;
  isDark: boolean;
  dayNumber: number;
  savedWordIds: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onSwipeRight: (item: CourseVocabularyCard) => void;
  onSwipeLeft: (item: CourseVocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  initialIndex?: number;
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
  initialIndex = 0,
  renderFinishView,
  isStudyCompleted,
}) => {
  if (courseId === "COLLOCATION") {
    const vocabularyCards = cards.filter(
      (card): card is VocabularyCard => !isKanjiWord(card),
    );
    return (
      <CollocationSwipeable
        data={vocabularyCards}
        isDark={isDark}
        initialIndex={initialIndex}
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
    const vocabularyCards = cards.filter(
      (card): card is VocabularyCard => !isKanjiWord(card),
    );
    return (
      <JlptSwipeDeck
        cards={vocabularyCards}
        dayNumber={dayNumber}
        savedWordIds={savedWordIds}
        onSavedWordChange={onSavedWordChange}
        onSwipeRight={onSwipeRight as (item: VocabularyCard) => void}
        onSwipeLeft={onSwipeLeft as (item: VocabularyCard) => void}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        initialIndex={initialIndex}
      />
    );
  }

  if (courseId === "KANJI") {
    const kanjiCards = cards.filter(isKanjiWord);
    return (
      <KanjiSwipeDeck
        cards={kanjiCards}
        dayNumber={dayNumber}
        savedWordIds={savedWordIds}
        onSavedWordChange={onSavedWordChange}
        onSwipeRight={onSwipeRight as (item: KanjiWord) => void}
        onSwipeLeft={onSwipeLeft as (item: KanjiWord) => void}
        onIndexChange={onIndexChange}
        onFinish={onFinish}
        initialIndex={initialIndex}
      />
    );
  }

  const vocabularyCards = cards.filter(
    (card): card is VocabularyCard => !isKanjiWord(card),
  );

  return (
    <CarouselSwipeDeck
      cards={vocabularyCards}
      dayNumber={dayNumber}
      savedWordIds={savedWordIds}
      onSavedWordChange={onSavedWordChange}
      onSwipeRight={onSwipeRight as (item: VocabularyCard) => void}
      onSwipeLeft={onSwipeLeft as (item: VocabularyCard) => void}
      onIndexChange={onIndexChange}
      onFinish={onFinish}
      initialIndex={initialIndex}
    />
  );
};

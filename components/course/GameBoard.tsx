import React from "react";
import { View } from "react-native";
import { MatchingGame } from "./MatchingGame";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  matchItemId?: string;
  matchChoiceId?: string;
  matchChoiceText?: string;
  pronunciation?: string;
  correctAnswer: string;
}

interface GameBoardProps {
  quizType: "matching";
  courseId?: string;
  currentQuestion: QuizQuestion;
  questions: QuizQuestion[];

  progressCurrent: number;
  courseColor?: string;
  isDark: boolean;
  showPronunciationDetails?: boolean;

  matchingMeanings: string[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  wrongWord?: string | null;
  wrongMeaning?: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
  onMatchingPageAdvance?: () => void;
}

export function GameBoard({
  courseId,
  questions,
  progressCurrent,
  courseColor,
  isDark,
  matchingMeanings,
  selectedWord,
  selectedMeaning,
  wrongWord,
  wrongMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  onMatchingPageAdvance,
  showPronunciationDetails = false,
}: GameBoardProps) {
  return (
    <View style={{ flex: 1 }}>
      <MatchingGame
        questions={questions}
        courseId={courseId}
        meanings={matchingMeanings}
        selectedWord={selectedWord}
        selectedMeaning={selectedMeaning}
        wrongWord={wrongWord}
        wrongMeaning={wrongMeaning}
        matchedPairs={matchedPairs}
        onSelectWord={onSelectWord}
        onSelectMeaning={onSelectMeaning}
        onPageAdvance={onMatchingPageAdvance}
        courseColor={courseColor}
        isDark={isDark}
        showPronunciationDetails={showPronunciationDetails}
        progressCurrent={progressCurrent}
      />
    </View>
  );
}

import React from "react";
import { View } from "react-native";
import { FillInTheBlankGame } from "./FillInTheBlankGame";
import { GameScore } from "./GameScore";
import { MatchingGame } from "./MatchingGame";
import { MultipleChoiceGame } from "./MultipleChoiceGame";
import { QuizFeedback } from "./QuizFeedback";
import { SpellingGame } from "./SpellingGame";
import { WordArrangementGame } from "./WordArrangementGame";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  options?: string[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  correctForms?: string[];
}

interface VocabData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  translation?: string;
}

interface GameBoardProps {
  // Quiz type and state
  quizType: string;
  currentQuestion: QuizQuestion;
  questions: QuizQuestion[];

  // Progress
  progressCurrent: number;
  courseColor?: string;
  isDark: boolean;

  // Matching game props
  matchingMeanings: string[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;

  // Spelling game props
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  showResult: boolean;
  isCorrect: boolean;
  onSubmit: () => void;

  // Fill in the blank props
  onAnswer: (answer: string) => void;

  // Word arrangement props
  currentArrangementWord: VocabData | null;
  selectedChunksByArea: string[][];
  shuffledChunks: string[];
  arrangementComplete: boolean;
  sentenceChunkCounts: number[];
  focusedSentenceIndex: number;
  onFocusChange: (index: number) => void;
  onChunkSelect: (chunk: string, index: number) => void;
  onChunkDeselect: (areaIndex: number, chunkIndex: number) => void;
  onArrangementNext: () => void;
}

export function GameBoard({
  quizType,
  currentQuestion,
  questions,
  progressCurrent,
  courseColor,
  isDark,
  matchingMeanings,
  selectedWord,
  selectedMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  userAnswer,
  setUserAnswer,
  showResult,
  isCorrect,
  onSubmit,
  onAnswer,
  currentArrangementWord,
  selectedChunksByArea,
  shuffledChunks,
  arrangementComplete,
  sentenceChunkCounts,
  focusedSentenceIndex,
  onFocusChange,
  onChunkSelect,
  onChunkDeselect,
  onArrangementNext,
}: GameBoardProps) {
  const isMatching = quizType === "matching";
  const isSpelling = quizType === "spelling";
  const isFillInBlank = quizType === "fill-in-blank";
  const isWordArrangement = quizType === "word-arrangement";

  return (
    <View>
      {/* Progress Bar */}
      <GameScore
        current={progressCurrent}
        total={questions.length}
        courseColor={courseColor}
        isDark={isDark}
      />

      {/* Game Section */}
      {isMatching ? (
        <MatchingGame
          questions={questions}
          meanings={matchingMeanings}
          selectedWord={selectedWord}
          selectedMeaning={selectedMeaning}
          matchedPairs={matchedPairs}
          onSelectWord={onSelectWord}
          onSelectMeaning={onSelectMeaning}
          courseColor={courseColor}
          isDark={isDark}
        />
      ) : isSpelling ? (
        <SpellingGame
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          showResult={showResult}
          isCorrect={isCorrect}
          onSubmit={onSubmit}
          courseColor={courseColor}
          meaning={currentQuestion.meaning}
        />
      ) : isFillInBlank ? (
        <FillInTheBlankGame
          word={currentQuestion.word}
          clozeSentence={currentQuestion.clozeSentence || ""}
          translation={currentQuestion.translation}
          options={currentQuestion.options || []}
          correctAnswer={currentQuestion.correctAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
          onAnswer={onAnswer}
          correctForms={currentQuestion.correctForms}
        />
      ) : isWordArrangement ? (
        <WordArrangementGame
          word={currentArrangementWord?.word || ""}
          meaning={currentArrangementWord?.meaning || ""}
          translation={currentArrangementWord?.translation}
          selectedChunksByArea={selectedChunksByArea}
          availableChunks={shuffledChunks}
          isComplete={arrangementComplete}
          sentenceChunkCounts={sentenceChunkCounts}
          courseColor={courseColor}
          focusedSentenceIndex={focusedSentenceIndex}
          onFocusChange={onFocusChange}
          onChunkSelect={onChunkSelect}
          onChunkDeselect={onChunkDeselect}
          onNext={onArrangementNext}
        />
      ) : (
        <MultipleChoiceGame
          options={currentQuestion.options || []}
          correctAnswer={currentQuestion.correctAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
          onAnswer={onAnswer}
          word={currentQuestion.word}
        />
      )}

      {/* Result Feedback */}
      {showResult && !isMatching && (
        <QuizFeedback
          isCorrect={isCorrect}
          correctAnswer={currentQuestion.correctAnswer}
        />
      )}
    </View>
  );
}

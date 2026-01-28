import React from "react";
import { View } from "react-native";
import { CollocationGapFillSentenceGame } from "./CollocationGapFillSentenceGame";
import { CollocationMatchingGame } from "./CollocationMatchingGame";
import { ErrorCorrectionGame } from "./ErrorCorrectionGame";
import { FillInTheBlankGame } from "./FillInTheBlankGame";
import { GameScore } from "./GameScore";
import { MatchingGame } from "./MatchingGame";
import { MultipleChoiceGame } from "./MultipleChoiceGame";
import { QuizFeedback } from "./QuizFeedback";
import { SpellingGame } from "./SpellingGame";
import { WordArrangementGame } from "./WordArrangementGame";
import { WordOrderTilesGame } from "./WordOrderTilesGame";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  options?: string[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  correctForms?: string[];
  prompt?: string;
  highlightText?: string;
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
  quizVariant?: string;
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
  quizVariant,
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
  const variant = quizVariant || quizType;
  const isCollocationGapFill = variant === "gap-fill-sentence";
  const isCollocationMatching = variant === "collocation-matching";
  const isErrorCorrection = variant === "error-correction";
  const isWordOrderTiles = variant === "word-order-tiles";
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
      {isCollocationMatching ? (
        <CollocationMatchingGame
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
      ) : isMatching ? (
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
      ) : isCollocationGapFill ? (
        <CollocationGapFillSentenceGame
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
      ) : isWordOrderTiles ? (
        <WordOrderTilesGame
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
        <>
          {isErrorCorrection ? (
            <ErrorCorrectionGame
              options={currentQuestion.options || []}
              correctAnswer={currentQuestion.correctAnswer}
              userAnswer={userAnswer}
              showResult={showResult}
              onAnswer={onAnswer}
              roleplay={currentQuestion.word}
              questionLabel={currentQuestion.prompt}
              highlightText={currentQuestion.highlightText}
            />
          ) : (
            <MultipleChoiceGame
              options={currentQuestion.options || []}
              correctAnswer={currentQuestion.correctAnswer}
              userAnswer={userAnswer}
              showResult={showResult}
              onAnswer={onAnswer}
              word={currentQuestion.word}
              questionLabel={currentQuestion.prompt}
            />
          )}
        </>
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

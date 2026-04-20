import React from "react";
import type { QuizWordOption } from "../../src/course/quizUtils";
import { View } from "react-native";
import { CollocationGapFillSentenceGame } from "./CollocationGapFillSentenceGame";
import { CollocationMatchingGame } from "./CollocationMatchingGame";
import { FillInTheBlankGame } from "./FillInTheBlankGame";
import { GameScore } from "./GameScore";
import { MatchingGame } from "./MatchingGame";
import { MultipleChoiceGame } from "./MultipleChoiceGame";
import { QuizFeedback } from "./QuizFeedback";
import { SynonymMatchingGame } from "./SynonymMatchingGame";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  matchItemId?: string;
  matchChoiceId?: string;
  matchChoiceText?: string;
  synonym?: string;
  pronunciation?: string;

  options?: string[] | QuizWordOption[];
  correctAnswer: string;
  clozeSentence?: string;
  translation?: string;
  localizedPronunciation?: string;
  correctForms?: string[];
  prompt?: string;
  highlightText?: string;
}

interface GameBoardProps {
  quizType: string;
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
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;

  userAnswer: string;
  showResult: boolean;
  isCorrect: boolean;
  matchingMode?: "meaning" | "synonym" | "pronunciation";

  onAnswer: (answer: string) => void;
}

export function GameBoard({
  quizType,
  courseId,
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
  showResult,
  isCorrect,
  matchingMode = "meaning",
  onAnswer,
  showPronunciationDetails = false,
}: GameBoardProps) {
  const isCollocationGapFill = quizType === "gap-fill-sentence";
  const isCollocationMatching = quizType === "collocation-matching";
  const isMatching =
    quizType === "matching" ||
    quizType === "synonym-matching" ||
    quizType === "pronunciation-matching";
  const isFillInBlank = quizType === "fill-in-blank";

  return (
    <View style={(isMatching || isCollocationMatching) ? { flex: 1 } : undefined}>
      <GameScore
        current={progressCurrent}
        total={questions.length}
        courseColor={courseColor}
        isDark={isDark}
      />

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
      ) : quizType === "synonym-matching" ? (
        <SynonymMatchingGame
          questions={questions}
          selectedWord={selectedWord}
          selectedMeaning={selectedMeaning}
          matchedPairs={matchedPairs}
          onSelectWord={onSelectWord}
          onSelectMeaning={onSelectMeaning}
          courseColor={courseColor}
          isDark={isDark}
          showPronunciationDetails={showPronunciationDetails}
        />
      ) : isMatching ? (
        <MatchingGame
          questions={questions}
          courseId={courseId}
          meanings={matchingMeanings}
          selectedWord={selectedWord}
          selectedMeaning={selectedMeaning}
          matchedPairs={matchedPairs}
          onSelectWord={onSelectWord}
          onSelectMeaning={onSelectMeaning}
          courseColor={courseColor}
          isDark={isDark}
          showPronunciationDetails={showPronunciationDetails}
          matchingMode={matchingMode}
        />
      ) : isCollocationGapFill ? (
        <CollocationGapFillSentenceGame
          word={currentQuestion.word}
          clozeSentence={currentQuestion.clozeSentence || ""}
          translation={currentQuestion.translation}
          localizedPronunciation={currentQuestion.localizedPronunciation}
          options={(currentQuestion.options as string[]) || []}
          correctAnswer={currentQuestion.correctAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
          onAnswer={onAnswer}
          correctForms={currentQuestion.correctForms}
        />
      ) : isFillInBlank ? (
        <FillInTheBlankGame
          word={currentQuestion.word}
          courseId={courseId}
          clozeSentence={currentQuestion.clozeSentence || ""}
          translation={currentQuestion.translation}
          localizedPronunciation={currentQuestion.localizedPronunciation}
          options={(currentQuestion.options as QuizWordOption[]) || []}
          correctAnswer={currentQuestion.correctAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
          onAnswer={onAnswer}
          correctForms={currentQuestion.correctForms}
          showPronunciationDetails={showPronunciationDetails}
        />
      ) : (
        <MultipleChoiceGame
          options={(currentQuestion.options as string[]) || []}
          courseId={courseId}
          correctAnswer={currentQuestion.correctAnswer}
          userAnswer={userAnswer}
          showResult={showResult}
          onAnswer={onAnswer}
          word={currentQuestion.word}
          questionLabel={currentQuestion.prompt}
        />
      )}

      {showResult && !isMatching && (
        <QuizFeedback
          isCorrect={isCorrect}
          correctAnswer={currentQuestion.correctAnswer}
        />
      )}
    </View>
  );
}

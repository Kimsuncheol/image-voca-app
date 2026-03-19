import React from "react";
import type { QuizWordOption } from "../../src/course/quizUtils";
import { StyleSheet, View } from "react-native";
import { FillInTheBlankGameClozeSentenceCard } from "./FillInTheBlankGameClozeSentenceCard";
import { FillInTheBlankGameOptions } from "./FillInTheBlankGameOptions";

interface FillInTheBlankGameProps {
  word: string;
  clozeSentence: string;
  translation?: string;
  localizedPronunciation?: string;
  options: Array<QuizWordOption | string>;
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  correctForms?: string[];
  showPronunciationDetails?: boolean;
}

export function FillInTheBlankGame({
  word,
  clozeSentence,
  translation,
  localizedPronunciation,
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  correctForms,
  showPronunciationDetails = false,
}: FillInTheBlankGameProps) {
  const isCorrect =
    userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  return (
    <View style={styles.container}>
      <FillInTheBlankGameClozeSentenceCard
        clozeSentence={clozeSentence}
        translation={translation}
        localizedPronunciation={localizedPronunciation}
        userAnswer={userAnswer}
        showResult={showResult}
        isCorrect={isCorrect}
        correctForms={correctForms}
      />

      <FillInTheBlankGameOptions
        options={options}
        correctAnswer={correctAnswer}
        userAnswer={userAnswer}
        showResult={showResult}
        onAnswer={onAnswer}
        showPronunciationDetails={showPronunciationDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    flex: 1,
  },
});

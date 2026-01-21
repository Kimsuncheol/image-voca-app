import React from "react";
import { StyleSheet, View } from "react-native";
import { FillInTheBlankGameClozeSentenceCard } from "./FillInTheBlankGameClozeSentenceCard";
import { FillInTheBlankGameOptions } from "./FillInTheBlankGameOptions";

interface FillInTheBlankGameProps {
  word: string;
  clozeSentence: string;
  translation?: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  correctForms?: string[];
}

export function FillInTheBlankGame({
  word,
  clozeSentence,
  translation,
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  correctForms,
}: FillInTheBlankGameProps) {
  const isCorrect =
    userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  return (
    <View style={styles.container}>
      <FillInTheBlankGameClozeSentenceCard
        clozeSentence={clozeSentence}
        translation={translation}
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

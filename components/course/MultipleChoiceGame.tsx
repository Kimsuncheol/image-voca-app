import React from "react";
import { StyleSheet, View } from "react-native";
import { MultipleChoiceOptions } from "./MultipleChoiceOptions";
import { MultipleChoiceQuestionCard } from "./MultipleChoiceQuestionCard";

interface MultipleChoiceGameProps {
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  word?: string;
  roleplay?: string;
  questionLabel?: string;
  questionLabelStyle?: object;
  contentStyle?: object;
}

export function MultipleChoiceGame({
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  word,
  roleplay,
  questionLabel,
  questionLabelStyle,
  contentStyle,
}: MultipleChoiceGameProps) {
  return (
    <View style={styles.container}>
      <MultipleChoiceQuestionCard
        word={word}
        roleplay={roleplay}
        questionLabel={questionLabel}
        questionLabelStyle={questionLabelStyle}
        contentStyle={contentStyle}
      />

      <MultipleChoiceOptions
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
    gap: 24,
    flex: 1,
  },
});

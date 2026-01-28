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
  highlightText?: string;
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
  highlightText,
}: MultipleChoiceGameProps) {
  return (
    <View style={styles.container}>
      <MultipleChoiceQuestionCard
        word={word}
        roleplay={roleplay}
        questionLabel={questionLabel}
        questionLabelStyle={questionLabelStyle}
        contentStyle={contentStyle}
        highlightText={highlightText}
        showResult={showResult}
        correctAnswer={correctAnswer}
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

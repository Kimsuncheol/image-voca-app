import React from "react";
import { StyleSheet, View } from "react-native";
import { QuizTypeCard } from "./QuizTypeCard";

interface QuizType {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

interface QuizTypeGridProps {
  quizTypes: QuizType[];
  onQuizTypeSelect: (quizType: QuizType) => void;
}

export function QuizTypeGrid({
  quizTypes,
  onQuizTypeSelect,
}: QuizTypeGridProps) {
  return (
    <View style={styles.quizGrid}>
      {quizTypes.map((quizType) => (
        <QuizTypeCard
          key={quizType.id}
          quizType={quizType}
          onPress={() => onQuizTypeSelect(quizType)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  quizGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});

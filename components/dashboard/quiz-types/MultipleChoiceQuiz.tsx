/**
 * ====================================
 * MULTIPLE CHOICE QUIZ COMPONENT
 * ====================================
 *
 * Displays a word and four meaning options for user to select from.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { getDynamicFontSize } from "../utils/quizHelpers";
import { PopQuizOption } from "./PopQuizOption";

interface QuizItem {
  word: string;
  meaning: string;
}

interface MultipleChoiceQuizProps {
  quizItem: QuizItem;
  options: string[];
  selectedOption: string | null;
  isCorrect: boolean | null;
  isDark: boolean;
  onOptionPress: (option: string) => void;
}

export function MultipleChoiceQuiz({
  quizItem,
  options,
  selectedOption,
  isCorrect,
  isDark,
  onOptionPress,
}: MultipleChoiceQuizProps) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.question}>
        <ThemedText style={styles.questionLabel}>
          {t("dashboard.popQuiz.question")}
        </ThemedText>
        <ThemedText
          style={[
            styles.questionText,
            { fontSize: getDynamicFontSize(quizItem.word) },
          ]}
        >
          {quizItem.word}
        </ThemedText>
      </View>

      <View style={styles.options}>
        {options.map((option, index) => (
          <PopQuizOption
            key={`${option}-${index}`}
            option={option}
            isSelected={selectedOption === option}
            isCorrect={option === quizItem.meaning}
            isAnswered={isCorrect === true}
            isDark={isDark}
            onPress={onOptionPress}
          />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  question: {
    gap: 4,
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "700",
  },
  options: {
    gap: 8,
  },
});

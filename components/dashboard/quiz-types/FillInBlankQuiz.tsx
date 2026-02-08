/**
 * ====================================
 * FILL IN BLANK QUIZ COMPONENT
 * ====================================
 *
 * Displays a cloze sentence with a blank and four word options to fill it.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { PopQuizOption } from "./PopQuizOption";

interface QuizItem {
  word: string;
  meaning: string;
  clozeSentence?: string;
  translation?: string;
}

interface FillInBlankQuizProps {
  quizItem: QuizItem;
  options: string[];
  selectedOption: string | null;
  isCorrect: boolean | null;
  isDark: boolean;
  onOptionPress: (option: string) => void;
}

export function FillInBlankQuiz({
  quizItem,
  options,
  selectedOption,
  isCorrect,
  isDark,
  onOptionPress,
}: FillInBlankQuizProps) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.question}>
        <ThemedText style={styles.questionLabel}>
          {t("dashboard.popQuiz.fillInBlank", {
            defaultValue: "Complete the sentence",
          })}
        </ThemedText>
        <ThemedText style={styles.clozeSentence}>
          {quizItem.clozeSentence}
        </ThemedText>
        {quizItem.translation && (
          <ThemedText style={styles.translation}>
            {quizItem.translation}
          </ThemedText>
        )}
      </View>

      <View style={styles.options}>
        {options.map((option, index) => (
          <PopQuizOption
            key={`${option}-${index}`}
            option={option}
            isSelected={selectedOption === option}
            isCorrect={option.toLowerCase() === quizItem.word.toLowerCase()}
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
  clozeSentence: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
    marginVertical: 8,
  },
  translation: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 8,
  },
  options: {
    gap: 8,
  },
});

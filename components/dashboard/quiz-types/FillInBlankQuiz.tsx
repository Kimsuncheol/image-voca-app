/**
 * ====================================
 * FILL IN THE BLANK QUIZ COMPONENT
 * ====================================
 *
 * Shows a Japanese example sentence with the target word blanked out (___).
 * User picks the correct Japanese word from 4 options.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { PopQuizOption } from "./PopQuizOption";

interface FillInBlankQuizProps {
  clozeSentence: string;
  options: string[];
  correctWord: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  isDark: boolean;
  onOptionPress: (option: string) => void;
}

export function FillInBlankQuiz({
  clozeSentence,
  options,
  correctWord,
  selectedOption,
  isCorrect,
  isDark,
  onOptionPress,
}: FillInBlankQuizProps) {
  return (
    <>
      <View style={styles.sentence}>
        <ThemedText style={styles.sentenceText}>{clozeSentence}</ThemedText>
      </View>

      <View style={styles.options}>
        {options.map((option, index) => (
          <PopQuizOption
            key={`${option}-${index}`}
            option={option}
            isSelected={selectedOption === option}
            isCorrect={option === correctWord}
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
  sentence: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  sentenceText: {
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 30,
  },
  options: {
    gap: 8,
  },
});

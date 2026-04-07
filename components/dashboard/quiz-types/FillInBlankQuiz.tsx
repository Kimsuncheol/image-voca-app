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
import { stripKanaParens } from "../../../src/utils/japaneseText";
import { ThemedText } from "../../themed-text";
import { PopQuizOption } from "./PopQuizOption";
import type { DashboardWordOption as WordOption } from "../utils/quizHelpers";

export type { DashboardWordOption as WordOption } from "../utils/quizHelpers";

interface FillInBlankQuizProps {
  clozeSentence: string;
  options: WordOption[];
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
  const displaySentence = React.useMemo(
    () => stripKanaParens(clozeSentence),
    [clozeSentence],
  );

  return (
    <>
      <View style={styles.sentence}>
        <ThemedText style={styles.sentenceText}>{displaySentence}</ThemedText>
      </View>

      <View style={styles.options}>
        {options.map(({ word, pronunciation }, index) => (
          <PopQuizOption
            key={`${word}-${index}`}
            option={word}
            subtitle={
              pronunciation && pronunciation !== word ? pronunciation : undefined
            }
            isSelected={selectedOption === word}
            isCorrect={word === correctWord}
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

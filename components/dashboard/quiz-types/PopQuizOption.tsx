/**
 * ====================================
 * POP QUIZ OPTION COMPONENT
 * ====================================
 *
 * A single selectable option in a multiple choice or fill-in-blank quiz.
 * Shows visual feedback for selected, correct, and incorrect states.
 */

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../../themed-text";

export interface PopQuizOptionProps {
  option: string;
  subtitle?: string;
  secondarySubtitle?: string;
  isSelected: boolean;
  isCorrect: boolean;
  isAnswered: boolean;
  isDark: boolean;
  onPress: (option: string) => void;
}

export const PopQuizOption = React.memo(
  ({
    option,
    subtitle,
    secondarySubtitle,
    isSelected,
    isCorrect,
    isAnswered,
    isDark,
    onPress,
  }: PopQuizOptionProps) => {
    return (
      <TouchableOpacity
        style={[
          styles.option,
          { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
          isSelected &&
            (isCorrect ? styles.optionCorrect : styles.optionIncorrect),
        ]}
        onPress={() => onPress(option)}
        activeOpacity={0.8}
        disabled={isAnswered}
      >
        <ThemedText style={styles.optionText}>{option}</ThemedText>
        {subtitle ? (
          <ThemedText style={styles.subtitleText}>{subtitle}</ThemedText>
        ) : null}
        {secondarySubtitle ? (
          <ThemedText style={styles.secondarySubtitleText}>
            {secondarySubtitle}
          </ThemedText>
        ) : null}
      </TouchableOpacity>
    );
  },
);

PopQuizOption.displayName = "PopQuizOption";

const styles = StyleSheet.create({
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionText: {
    fontSize: 14,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
    textAlign: "center",
  },
  secondarySubtitleText: {
    fontSize: 11,
    opacity: 0.55,
    marginTop: 2,
    textAlign: "center",
  },
  optionCorrect: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
  },
  optionIncorrect: {
    borderColor: "#dc3545",
    backgroundColor: "#dc354520",
  },
});

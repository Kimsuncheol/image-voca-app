import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface FillInTheBlankGameOptionsProps {
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
}

export function FillInTheBlankGameOptions({
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
}: FillInTheBlankGameOptionsProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.optionsContainer}>
      <ThemedText style={styles.optionsLabel}>
        {t("quiz.fillInBlank.chooseWord")}
      </ThemedText>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
            showResult &&
              option === correctAnswer && {
                backgroundColor: "#28a74520",
                borderColor: "#28a745",
                borderWidth: 2,
              },
            showResult &&
              option !== correctAnswer &&
              userAnswer === option && {
                backgroundColor: "#dc354520",
                borderColor: "#dc3545",
                borderWidth: 2,
              },
          ]}
          onPress={() => {
            if (!showResult) {
              onAnswer(option);
            }
          }}
          disabled={showResult}
        >
          <ThemedText style={styles.optionText}>{option}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    gap: 10,
  },
  optionsLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
});

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface MultipleChoiceGameProps {
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  word: string;
}

export function MultipleChoiceGame({
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  word,
}: MultipleChoiceGameProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.questionCard,
          { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        ]}
      >
        <ThemedText style={styles.questionLabel}>
          {t("quiz.questions.meaningOf")}
        </ThemedText>
        <ThemedText type="title" style={styles.wordText}>
          {word}
        </ThemedText>
      </View>

      <View style={styles.optionsContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    flex: 1,
  },
  questionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
    textAlign: "center",
  },
  wordText: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "700",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionText: {
    fontSize: 18,
    textAlign: "center",
  },
});

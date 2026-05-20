import { BorderColors } from "@/constants/borderColors";
import { FontSizes } from "@/constants/fontSizes";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface MultipleChoiceOptionsProps {
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
}

export function MultipleChoiceOptions({
  options,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
}: MultipleChoiceOptionsProps) {
  const { isDark } = useTheme();

  return (
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
                borderColor: BorderColors.light.success,
                borderWidth: 2,
              },
            showResult &&
              option !== correctAnswer &&
              userAnswer === option && {
                backgroundColor: "#dc354520",
                borderColor: BorderColors.light.danger,
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
    gap: 12,
  },
  optionButton: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BorderColors.light.quizOptionIdle,
  },
  optionText: {
    fontSize: FontSizes.title,
    textAlign: "center",
  },
});

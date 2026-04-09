import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { QuizWordOption } from "../../src/course/quizUtils";
import { useTheme } from "../../src/context/ThemeContext";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { ThemedText } from "../themed-text";

interface FillInTheBlankGameOptionsProps {
  options: Array<QuizWordOption | string>;
  courseId?: string;
  correctAnswer: string;
  userAnswer: string;
  showResult: boolean;
  onAnswer: (answer: string) => void;
  showPronunciationDetails?: boolean;
}

export function FillInTheBlankGameOptions({
  options,
  courseId,
  correctAnswer,
  userAnswer,
  showResult,
  onAnswer,
  showPronunciationDetails = false,
}: FillInTheBlankGameOptionsProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.optionsContainer}>
      <ThemedText style={styles.optionsLabel}>
        {t("quiz.types.fillInBlank.chooseWord")}
      </ThemedText>
      {options.map((option, index) => {
        const normalizedOption =
          typeof option === "string" ? { word: option } : option;
        const optionFontSize = getIdiomTitleFontSize(
          normalizedOption.word,
          courseId,
          16,
        );

        return (
          <TouchableOpacity
            key={`${normalizedOption.word}-${index}`}
            style={[
              styles.optionButton,
              { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
              showResult &&
                normalizedOption.word === correctAnswer && {
                  backgroundColor: "#28a74520",
                  borderColor: "#28a745",
                  borderWidth: 2,
                },
              showResult &&
                normalizedOption.word !== correctAnswer &&
                userAnswer === normalizedOption.word && {
                  backgroundColor: "#dc354520",
                  borderColor: "#dc3545",
                  borderWidth: 2,
                },
            ]}
            onPress={() => {
              if (!showResult) {
                onAnswer(normalizedOption.word);
              }
            }}
            disabled={showResult}
          >
            <ThemedText
              style={[
                styles.optionText,
                {
                  fontSize: optionFontSize,
                  lineHeight: Math.round(optionFontSize * 1.2),
                },
              ]}
            >
              {normalizedOption.word}
            </ThemedText>
            {showPronunciationDetails && normalizedOption.pronunciation ? (
              <ThemedText style={styles.pronunciationText}>
                {normalizedOption.pronunciation}
              </ThemedText>
            ) : null}
          </TouchableOpacity>
        );
      })}
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
  pronunciationText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
});

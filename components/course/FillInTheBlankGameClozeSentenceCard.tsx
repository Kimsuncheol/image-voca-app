import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface FillInTheBlankGameClozeSentenceCardProps {
  clozeSentence: string;
  translation?: string;
  userAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  correctForms?: string[];
}

export function FillInTheBlankGameClozeSentenceCard({
  clozeSentence,
  translation,
  userAnswer,
  showResult,
  isCorrect,
  correctForms = [],
}: FillInTheBlankGameClozeSentenceCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Parse the sentence to separate text and blanks
  const renderSentenceWithBlanks = () => {
    // Split by newlines to handle multiple sentences
    const lines = clozeSentence.split("\n").filter((line) => line.trim());
    let blankCounter = 0;

    return lines.map((line, lineIndex) => {
      // Split each line by the blank marker
      const parts = line.split("___");

      return (
        <View key={lineIndex} style={styles.sentenceLine}>
          <Text
            style={[styles.sentenceText, { color: isDark ? "#fff" : "#000" }]}
          >
            {parts.map((part, partIndex) => {
              const isLastPart = partIndex === parts.length - 1;
              if (isLastPart) {
                return <React.Fragment key={partIndex}>{part}</React.Fragment>;
              }

              const currentBlankIndex = blankCounter++;
              // If correct answer is selected (isCorrect), show the proper tense form (correctForms[index])
              // Otherwise show the user's selected base word
              const displayWord =
                userAnswer && isCorrect && correctForms[currentBlankIndex]
                  ? correctForms[currentBlankIndex]
                  : userAnswer || "         ";

              return (
                <React.Fragment key={partIndex}>
                  {part}
                  <Text
                    style={[
                      styles.blank,
                      {
                        backgroundColor: userAnswer
                          ? showResult
                            ? isCorrect
                              ? "#28a74520"
                              : "#dc354520"
                            : isDark
                              ? "#2c2c2e"
                              : "#e8e8e8"
                          : isDark
                            ? "#2c2c2e"
                            : "#e8e8e8",
                        borderColor: userAnswer
                          ? showResult
                            ? isCorrect
                              ? "#28a745"
                              : "#dc3545"
                            : isDark
                              ? "#3a3a3c"
                              : "#d1d1d6"
                          : isDark
                            ? "#3a3a3c"
                            : "#d1d1d6",
                        color: userAnswer
                          ? showResult
                            ? isCorrect
                              ? "#28a745"
                              : "#dc3545"
                            : isDark
                              ? "#007AFF"
                              : "#007AFF"
                          : isDark
                            ? "#666"
                            : "#999",
                        minWidth: displayWord === "         " ? 80 : undefined,
                        paddingHorizontal: displayWord === "         " ? 8 : 12,
                      },
                    ]}
                  >
                    {displayWord}
                  </Text>
                </React.Fragment>
              );
            })}
          </Text>
        </View>
      );
    });
  };

  return (
    <View
      style={[
        styles.sentenceCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <ThemedText style={styles.sentenceLabel}>
        {t("quiz.types.fillInBlank.completeSentence")}
      </ThemedText>
      {renderSentenceWithBlanks()}
      {translation && (
        <ThemedText style={styles.translationText}>{translation}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sentenceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sentenceLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  sentenceLine: {
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 18,
    lineHeight: 28,
  },
  blank: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: "dashed",
    fontWeight: "600",
    fontSize: 18,
    minWidth: 80,
    textAlign: "center",
    overflow: "hidden",
  },
  translationText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: "italic",
    marginTop: 8,
  },
});

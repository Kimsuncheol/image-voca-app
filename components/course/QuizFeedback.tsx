import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface QuizFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
}

export function QuizFeedback({ isCorrect, correctAnswer }: QuizFeedbackProps) {
  const { t } = useTranslation();

  if (isCorrect) return null;

  return (
    <View style={styles.feedbackContainer}>
      <View style={[styles.feedbackBadge, { backgroundColor: "#dc3545" }]}>
        <Ionicons name="close-circle" size={24} color="#fff" />
        <ThemedText style={styles.feedbackText}>
          {t("quiz.feedback.incorrect")}
        </ThemedText>
      </View>
      <ThemedText style={styles.correctAnswerText}>
        {t("quiz.feedback.correctAnswer", {
          answer: correctAnswer,
        })}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackContainer: {
    alignItems: "center",
    gap: 16,
  },
  feedbackBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  correctAnswerText: {
    fontSize: 14,
    opacity: 0.8,
  },
});

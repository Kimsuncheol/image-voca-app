import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface QuizFinishViewProps {
  score: number;
  totalQuestions: number;
  isDark: boolean;
  onRetry: () => void;
  onFinish: () => void;
}

export function QuizFinishView({
  score,
  totalQuestions,
  isDark,
  onRetry,
  onFinish,
}: QuizFinishViewProps) {
  const { t } = useTranslation();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <View style={styles.resultContainer}>
      <View
        style={[
          styles.scoreCircle,
          {
            borderColor:
              percentage >= 80
                ? "#28a745"
                : percentage >= 60
                  ? "#ffc107"
                  : "#dc3545",
          },
        ]}
      >
        <ThemedText type="title" style={styles.scoreText}>
          {percentage}%
        </ThemedText>
        <ThemedText style={styles.scoreLabel}>
          {score}/{totalQuestions}
        </ThemedText>
      </View>

      <ThemedText type="subtitle" style={styles.resultMessage}>
        {percentage >= 80
          ? t("quiz.results.excellent")
          : percentage >= 60
            ? t("quiz.results.goodJob")
            : t("quiz.results.keepPracticing")}
      </ThemedText>

      <View style={styles.resultButtons}>
        <TouchableOpacity
          style={[styles.resultButton, styles.retryButton]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <ThemedText style={styles.resultButtonText}>
            {t("common.retry")}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultButton, styles.finishButton]}
          onPress={onFinish}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <ThemedText style={styles.resultButtonText}>
            {t("common.finish")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 48,
  },
  scoreLabel: {
    fontSize: 16,
    opacity: 0.6,
  },
  resultMessage: {
    fontSize: 24,
    marginBottom: 32,
  },
  resultButtons: {
    flexDirection: "row",
    gap: 16,
  },
  resultButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  retryButton: {
    backgroundColor: "#6c757d",
  },
  finishButton: {
    backgroundColor: "#28a745",
  },
  resultButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

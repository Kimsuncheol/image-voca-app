import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface WordArrangementCompleteProps {
  onNext: () => void;
  courseColor?: string;
}

export function WordArrangementComplete({
  onNext,
  courseColor = "#007AFF",
}: WordArrangementCompleteProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.completeContainer}>
      <View style={[styles.feedbackBadge, { backgroundColor: "#28a745" }]}>
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <ThemedText style={styles.feedbackText}>
          {t("quiz.wordArrangement.completed")}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: courseColor }]}
        onPress={onNext}
      >
        <ThemedText style={styles.nextButtonText}>
          {t("common.next")}
        </ThemedText>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  completeContainer: {
    alignItems: "center",
    gap: 16,
    marginTop: 8,
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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

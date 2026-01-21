import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
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

  // Auto-advance after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <View style={styles.completeContainer}>
      <View style={[styles.feedbackBadge, { backgroundColor: "#28a745" }]}>
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <ThemedText style={styles.feedbackText}>
          {t("quiz.wordArrangement.completed")}
        </ThemedText>
      </View>
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
});

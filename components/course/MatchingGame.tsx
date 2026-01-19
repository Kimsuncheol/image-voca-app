import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
}

interface MatchingGameProps {
  questions: QuizQuestion[];
  meanings: string[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
  feedback: string | null;
  courseColor?: string;
  isDark: boolean;
}

export function MatchingGame({
  questions,
  meanings,
  selectedWord,
  selectedMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  feedback,
  courseColor,
  isDark,
}: MatchingGameProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t("quiz.matching.instructions")}
      </ThemedText>
      <View style={styles.matchingColumns}>
        <View style={styles.matchingColumn}>
          {questions.map((question) => {
            const isMatched = Boolean(matchedPairs[question.word]);
            const isSelected = selectedWord === question.word;
            return (
              <TouchableOpacity
                key={question.word}
                style={[
                  styles.matchingItem,
                  { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                  isMatched && styles.matchingItemMatched,
                  isSelected && styles.matchingItemSelected,
                  isSelected && {
                    borderColor: courseColor || "#007AFF",
                    backgroundColor: (courseColor || "#007AFF") + "10",
                  },
                ]}
                onPress={() => onSelectWord(question.word)}
                disabled={isMatched}
              >
                <ThemedText
                  style={[
                    styles.matchingItemText,
                    isMatched && styles.matchingItemTextMatched,
                    isSelected && { color: courseColor || "#007AFF" },
                  ]}
                >
                  {question.word}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.matchingColumn}>
          {meanings.map((meaning) => {
            const isMatched = Object.values(matchedPairs).includes(meaning);
            const isSelected = selectedMeaning === meaning;
            return (
              <TouchableOpacity
                key={meaning}
                style={[
                  styles.matchingItem,
                  { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                  isMatched && styles.matchingItemMatched,
                  isSelected && styles.matchingItemSelected,
                  isSelected && {
                    borderColor: courseColor || "#007AFF",
                    backgroundColor: (courseColor || "#007AFF") + "10",
                  },
                ]}
                onPress={() => onSelectMeaning(meaning)}
                disabled={isMatched}
              >
                <ThemedText
                  style={[
                    styles.matchingItemText,
                    isMatched && styles.matchingItemTextMatched,
                    isSelected && { color: courseColor || "#007AFF" },
                  ]}
                >
                  {meaning}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {feedback && (
        <ThemedText style={styles.matchingFeedback}>{feedback}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  matchingContainer: {
    flex: 1,
    gap: 16,
  },
  matchingHint: {
    textAlign: "center",
    opacity: 0.6,
    fontSize: 14,
  },
  matchingColumns: {
    flexDirection: "row",
    gap: 12,
  },
  matchingColumn: {
    flex: 1,
    gap: 8,
  },
  matchingItem: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  matchingItemMatched: {
    borderColor: "#28a745",
    borderWidth: 2,
    backgroundColor: "#28a74510",
    opacity: 0.5,
  },
  matchingItemSelected: {
    borderWidth: 2,
    fontWeight: "bold",
  },
  matchingItemText: {
    textAlign: "center",
    fontSize: 15,
  },
  matchingItemTextMatched: {
    color: "#28a745",
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  matchingFeedback: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
});

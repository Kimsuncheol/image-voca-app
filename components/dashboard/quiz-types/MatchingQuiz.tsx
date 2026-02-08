/**
 * ====================================
 * MATCHING QUIZ COMPONENT
 * ====================================
 *
 * Displays two columns of words and meanings for user to match.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";

interface MatchingQuizProps {
  matchingWords: string[];
  matchingMeanings: string[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  matchedPairs: Record<string, string>;
  isDark: boolean;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
}

export function MatchingQuiz({
  matchingWords,
  matchingMeanings,
  selectedWord,
  selectedMeaning,
  matchedPairs,
  isDark,
  onSelectWord,
  onSelectMeaning,
}: MatchingQuizProps) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.question}>
        <ThemedText style={styles.questionLabel}>
          {t("dashboard.popQuiz.matching", {
            defaultValue: "Match words with meanings",
          })}
        </ThemedText>
        <ThemedText style={styles.subtext}>
          {t("dashboard.popQuiz.matchingHint", {
            defaultValue: "Tap a word, then tap its meaning",
          })}
        </ThemedText>
      </View>

      <View style={styles.container}>
        {/* Words Column */}
        <View style={styles.column}>
          <ThemedText style={styles.columnLabel}>
            {t("dashboard.popQuiz.words", { defaultValue: "Words" })}
          </ThemedText>
          {matchingWords.map((word) => (
            <TouchableOpacity
              key={word}
              style={[
                styles.item,
                { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                selectedWord === word && styles.itemSelected,
                matchedPairs[word] && styles.itemMatched,
              ]}
              onPress={() => onSelectWord(word)}
              disabled={!!matchedPairs[word]}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.itemText}>{word}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meanings Column */}
        <View style={styles.column}>
          <ThemedText style={styles.columnLabel}>
            {t("dashboard.popQuiz.meanings", {
              defaultValue: "Meanings",
            })}
          </ThemedText>
          {matchingMeanings.map((meaning) => (
            <TouchableOpacity
              key={meaning}
              style={[
                styles.item,
                { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                selectedMeaning === meaning && styles.itemSelected,
                Object.values(matchedPairs).includes(meaning) &&
                  styles.itemMatched,
              ]}
              onPress={() => onSelectMeaning(meaning)}
              disabled={Object.values(matchedPairs).includes(meaning)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.itemText} numberOfLines={2}>
                {meaning}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  question: {
    gap: 4,
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
  },
  subtext: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  container: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 48,
    justifyContent: "center",
  },
  itemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF20",
  },
  itemMatched: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
    opacity: 0.5,
  },
  itemText: {
    fontSize: 13,
  },
});

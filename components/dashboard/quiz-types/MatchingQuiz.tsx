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

interface MatchingOption {
  id: string;
  label: string;
}

interface MatchingQuizProps {
  matchingWords: MatchingOption[];
  matchingMeanings: MatchingOption[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  matchedPairs: Record<string, string>;
  isDark: boolean;
  onSelectWord: (wordId: string) => void;
  onSelectMeaning: (meaningId: string) => void;
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
  const matchedMeaningIds = Object.values(matchedPairs);

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
          {matchingWords.map((wordOption) => (
            <TouchableOpacity
              key={wordOption.id}
              style={[
                styles.item,
                { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                selectedWord === wordOption.id && styles.itemSelected,
                matchedPairs[wordOption.id] && styles.itemMatched,
              ]}
              onPress={() => onSelectWord(wordOption.id)}
              disabled={!!matchedPairs[wordOption.id]}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.itemText}>{wordOption.label}</ThemedText>
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
          {matchingMeanings.map((meaningOption) => {
            const isMatched = matchedMeaningIds.includes(meaningOption.id);

            return (
              <TouchableOpacity
                key={meaningOption.id}
                style={[
                  styles.item,
                  { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
                  selectedMeaning === meaningOption.id && styles.itemSelected,
                  isMatched && styles.itemMatched,
                ]}
                onPress={() => onSelectMeaning(meaningOption.id)}
                disabled={isMatched}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.itemText} numberOfLines={2}>
                  {meaningOption.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
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

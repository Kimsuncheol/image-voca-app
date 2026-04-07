/**
 * ====================================
 * MATCHING QUIZ COMPONENT
 * ====================================
 *
 * Displays word-value pairs in two columns.
 * User taps a word, then taps the matching value.
 * Correct matches turn green; wrong matches flash red.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";
import type { DashboardMatchingPair as MatchingPair } from "../utils/quizHelpers";

export type { DashboardMatchingPair as MatchingPair } from "../utils/quizHelpers";

interface MatchingQuizProps {
  pairs: MatchingPair[];
  isDark: boolean;
  onComplete: () => void;
  onWrong: () => void;
  onPairMatched?: () => void;
  matchingMode?: "meaning" | "synonym" | "pronunciation";
  instruction: string;
}

export function MatchingQuiz({
  pairs,
  isDark,
  onComplete,
  onWrong,
  onPairMatched,
  matchingMode = "meaning",
  instruction,
}: MatchingQuizProps) {
  const shuffledMeanings = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    [pairs],
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set());
  const [wrongWord, setWrongWord] = useState<string | null>(null);
  const [wrongMeaning, setWrongMeaning] = useState<string | null>(null);

  const isComplete = matchedWords.size === pairs.length;

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(onComplete, 150);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  const handleWordPress = useCallback(
    (word: string) => {
      if (matchedWords.has(word) || wrongWord) return;
      setSelectedWord((prev) => (prev === word ? null : word));
    },
    [matchedWords, wrongWord],
  );

  const handleMeaningPress = useCallback(
    (value: string) => {
      if (!selectedWord || wrongWord) return;

      const correctPair = pairs.find((p) => p.word === selectedWord);
      const expectedMatch =
        matchingMode === "synonym" && correctPair?.synonym
          ? correctPair.synonym
          : matchingMode === "pronunciation" && correctPair?.pronunciation
            ? correctPair.pronunciation
          : correctPair?.meaning;

      if (expectedMatch === value) {
        // Correct match
        setMatchedWords((prev) => new Set(prev).add(selectedWord));
        setSelectedWord(null);
        onPairMatched?.();
      } else {
        // Wrong match — flash red, then reset
        setWrongWord(selectedWord);
        setWrongMeaning(value);
        onWrong();
        setTimeout(() => {
          setWrongWord(null);
          setWrongMeaning(null);
          setSelectedWord(null);
        }, 600);
      }
    },
    [matchingMode, selectedWord, wrongWord, pairs, onWrong, onPairMatched],
  );

  const getWordStyle = (word: string) => {
    if (matchedWords.has(word)) return styles.matched;
    if (word === wrongWord) return styles.wrong;
    if (word === selectedWord) return styles.selected;
    return null;
  };

  const getMeaningStyle = (meaning: string) => {
    const isMatched = pairs.some(
      (p) =>
        (
          matchingMode === "synonym" && p.synonym
            ? p.synonym
            : matchingMode === "pronunciation" && p.pronunciation
              ? p.pronunciation
              : p.meaning
        ) === meaning &&
        matchedWords.has(p.word),
    );
    if (isMatched) return styles.matched;
    if (meaning === wrongMeaning) return styles.wrong;
    return null;
  };

  const cellBg = { backgroundColor: isDark ? "#2c2c2e" : "#fff" };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>{instruction}</ThemedText>
      {pairs.map((pair, index) => {
        const { word } = pair;
        const meaning =
          matchingMode === "synonym" && shuffledMeanings[index].synonym
            ? shuffledMeanings[index].synonym!
            : matchingMode === "pronunciation" &&
                shuffledMeanings[index].pronunciation
              ? shuffledMeanings[index].pronunciation!
            : shuffledMeanings[index].meaning;
        return (
          <View key={index} style={styles.row}>
            {/* Word cell */}
            <TouchableOpacity
              style={[styles.cell, cellBg, getWordStyle(word)]}
              onPress={() => handleWordPress(word)}
              activeOpacity={0.8}
              disabled={matchedWords.has(word) || !!wrongWord}
            >
              <View style={styles.wordStack}>
                <ThemedText style={styles.wordText}>{word}</ThemedText>
                {matchingMode === "meaning" &&
                pair.pronunciation &&
                pair.pronunciation !== word ? (
                  <ThemedText style={styles.pronunciationText}>
                    {pair.pronunciation}
                  </ThemedText>
                ) : null}
              </View>
            </TouchableOpacity>

            {/* Meaning cell */}
            <TouchableOpacity
              style={[styles.cell, cellBg, getMeaningStyle(meaning)]}
              onPress={() => handleMeaningPress(meaning)}
              activeOpacity={0.8}
              disabled={
                pairs.some(
                  (p) =>
                    (
                      matchingMode === "synonym" && p.synonym
                        ? p.synonym
                        : matchingMode === "pronunciation" && p.pronunciation
                          ? p.pronunciation
                          : p.meaning
                    ) === meaning && matchedWords.has(p.word),
                ) || !!wrongWord
              }
            >
              <ThemedText style={styles.meaningText}>{meaning}</ThemedText>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  hint: {
    textAlign: "center",
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  wordText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  wordStack: {
    alignItems: "center",
    gap: 2,
  },
  pronunciationText: {
    fontSize: 12,
    opacity: 0.75,
    textAlign: "center",
  },
  meaningText: {
    fontSize: 13,
    textAlign: "center",
  },
  selected: {
    borderColor: "#007aff",
    backgroundColor: "#007aff18",
  },
  matched: {
    borderColor: "#28a745",
    backgroundColor: "#28a74520",
  },
  wrong: {
    borderColor: "#dc3545",
    backgroundColor: "#dc354520",
  },
});

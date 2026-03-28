import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { MatchingCard } from "./MatchingCard";

const PAGE_SIZE = 5;

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
}

interface MatchingGameProps {
  questions: QuizQuestion[];
  meanings: string[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
  courseColor?: string;
  isDark: boolean;
  showPronunciationDetails?: boolean;
}

export function MatchingGame({
  questions,
  meanings: _unusedMeanings,
  selectedWord,
  selectedMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  courseColor,
  isDark,
  showPronunciationDetails = false,
}: MatchingGameProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(questions.length / PAGE_SIZE);
  const currentQuestions = questions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  // Shuffle meanings for the current page only; re-shuffle when page changes
  const shuffledMeanings = React.useMemo(() => {
    const shuffled = currentQuestions.map((q) => q.meaning);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Auto-advance to the next page when all current cards are matched
  useEffect(() => {
    if (currentQuestions.length === 0) return;
    const allMatched = currentQuestions.every((q) => matchedPairs[q.word]);
    if (allMatched && page < pageCount - 1) {
      const timer = setTimeout(() => setPage((p) => p + 1), 500);
      return () => clearTimeout(timer);
    }
  }, [matchedPairs, currentQuestions, page, pageCount]);

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t("quiz.matching.instructions")}
      </ThemedText>

      <View style={styles.matchingRows}>
        {currentQuestions.map((question, index) => {
          const meaning = shuffledMeanings[index];
          return (
            <View key={question.word} style={styles.matchingRow}>
              <View style={styles.matchingCell}>
                <MatchingCard
                  text={question.word}
                  pronunciation={
                    showPronunciationDetails ? question.pronunciation : undefined
                  }
                  variant="word"
                  isMatched={Boolean(matchedPairs[question.word])}
                  isSelected={selectedWord === question.word}
                  onPress={() => onSelectWord(question.word)}
                  courseColor={courseColor}
                  isDark={isDark}
                />
              </View>

              <View style={styles.matchingCell}>
                <MatchingCard
                  text={meaning}
                  variant="meaning"
                  isMatched={Object.values(matchedPairs).includes(meaning)}
                  isSelected={selectedMeaning === meaning}
                  onPress={() => onSelectMeaning(meaning)}
                  courseColor={courseColor}
                  isDark={isDark}
                />
              </View>
            </View>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  matchingContainer: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 4,
  },
  matchingHint: {
    textAlign: "center",
    opacity: 0.7,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "500",
  },
  matchingRows: {
    gap: 12,
  },
  matchingRow: {
    flexDirection: "row",
    gap: 16,
  },
  matchingCell: {
    flex: 1,
  },

});

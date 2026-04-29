import { FontWeights } from "@/constants/fontWeights";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { GameScore } from "./GameScore";
import { MatchingCard } from "./MatchingCard";
import { FontSizes } from "@/constants/fontSizes";

const PAGE_SIZE = 5;

interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  synonym?: string;
  pronunciation?: string;
}

interface SynonymMatchingGameProps {
  questions: QuizQuestion[];
  selectedWord: string | null;
  selectedMeaning: string | null;
  wrongWord?: string | null;
  wrongMeaning?: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
  courseColor?: string;
  isDark: boolean;
  showPronunciationDetails?: boolean;
  progressCurrent?: number;
  onPageAdvance?: () => void;
}

export function SynonymMatchingGame({
  questions,
  selectedWord,
  selectedMeaning,
  wrongWord,
  wrongMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  courseColor,
  isDark,
  showPronunciationDetails = false,
  progressCurrent = 0,
  onPageAdvance,
}: SynonymMatchingGameProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const pageCount = Math.ceil(questions.length / PAGE_SIZE);
  const currentQuestions = questions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const shuffledSynonyms = React.useMemo(() => {
    const shuffled = currentQuestions
      .map((question) => question.synonym)
      .filter((synonym): synonym is string => Boolean(synonym));

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [currentQuestions]);

  useEffect(() => {
    if (currentQuestions.length === 0) return;
    const allMatched = currentQuestions.every((question) => matchedPairs[question.word]);
    if (allMatched && page < pageCount - 1) {
      const timer = setTimeout(() => {
        setPage((currentPage) => currentPage + 1);
        onPageAdvance?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [matchedPairs, currentQuestions, page, pageCount, onPageAdvance]);

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t("quiz.synonymMatching.instructions")}
      </ThemedText>

      <GameScore
        current={progressCurrent}
        total={questions.length}
        courseColor={courseColor}
        isDark={isDark}
      />

      <View style={styles.matchingRows}>
        {currentQuestions.map((question, index) => {
          const synonym = shuffledSynonyms[index] ?? "";
          return (
            <View key={question.word} style={styles.matchingRow}>
              <View style={styles.matchingCell}>
                <MatchingCard
                  text={question.word}
                  variant="word"
                  pronunciation={showPronunciationDetails ? question.pronunciation : undefined}
                  isMatched={Boolean(matchedPairs[question.word])}
                  isSelected={selectedWord === question.word}
                  isIncorrect={wrongWord === question.word}
                  onPress={() => onSelectWord(question.word)}
                  courseColor={courseColor}
                  isDark={isDark}
                />
              </View>

              <View style={styles.matchingCell}>
                <MatchingCard
                  text={synonym}
                  variant="synonym"
                  isMatched={Object.values(matchedPairs).includes(synonym)}
                  isSelected={selectedMeaning === synonym}
                  isIncorrect={wrongMeaning === synonym}
                  onPress={() => onSelectMeaning(synonym)}
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
    fontSize: FontSizes.bodyMd,
    marginBottom: 8,
    fontWeight: FontWeights.medium,
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

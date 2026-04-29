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
  matchChoiceText?: string;
  synonym?: string;
  pronunciation?: string;
}

interface MatchingGameProps {
  questions: QuizQuestion[];
  meanings: string[];
  courseId?: string;
  selectedWord: string | null;
  selectedMeaning: string | null;
  wrongWord?: string | null;
  wrongMeaning?: string | null;
  matchedPairs: Record<string, string>;
  onSelectWord: (word: string) => void;
  onSelectMeaning: (meaning: string) => void;
  courseColor?: string;
  isDark: boolean;
  matchingMode?: "meaning" | "synonym" | "pronunciation";
  showPronunciationDetails?: boolean;
  progressCurrent?: number;
  onPageAdvance?: () => void;
}

export function MatchingGame({
  questions,
  meanings,
  courseId,
  selectedWord,
  selectedMeaning,
  wrongWord,
  wrongMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  courseColor,
  isDark,
  matchingMode = "meaning",
  showPronunciationDetails = false,
  progressCurrent = 0,
  onPageAdvance,
}: MatchingGameProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  useEffect(() => {
    console.log("MatchingGame questions:", questions);
  }, [questions]);

  const pageCount = Math.ceil(questions.length / PAGE_SIZE);
  const currentQuestions = questions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const getQuestionChoiceText = React.useCallback(
    (q: QuizQuestion) =>
      matchingMode === "synonym" && q.synonym
        ? q.synonym
        : matchingMode === "pronunciation" && q.pronunciation
          ? q.pronunciation
          : q.matchChoiceText ?? q.meaning,
    [matchingMode],
  );

  const visibleChoices = React.useMemo(() => {
    const currentChoiceTexts = currentQuestions.map(getQuestionChoiceText);
    if (meanings.length > 0) {
      const currentChoiceSet = new Set(currentChoiceTexts);
      const orderedChoices = meanings.filter((meaning) =>
        currentChoiceSet.has(meaning),
      );
      const missingChoices = currentChoiceTexts.filter(
        (choice) => !orderedChoices.includes(choice),
      );
      return [...orderedChoices, ...missingChoices];
    }

    const shuffled = [...currentChoiceTexts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [currentQuestions, getQuestionChoiceText, meanings]);

  // Auto-advance to the next page when all current cards are matched
  useEffect(() => {
    if (currentQuestions.length === 0) return;
    const allMatched = currentQuestions.every((q) => matchedPairs[q.word]);
    if (allMatched && page < pageCount - 1) {
      const timer = setTimeout(() => {
        setPage((p) => p + 1);
        onPageAdvance?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [matchedPairs, currentQuestions, page, pageCount, onPageAdvance]);

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t(
          matchingMode === "synonym"
            ? "quiz.synonymMatching.instructions"
            : matchingMode === "pronunciation"
              ? "quiz.pronunciationMatching.instructions"
              : "quiz.matching.instructions",
        )}
      </ThemedText>

      <GameScore
        current={progressCurrent}
        total={questions.length}
        courseColor={courseColor}
        isDark={isDark}
      />

      <View style={styles.matchingRows}>
        {currentQuestions.map((question, index) => {
          const meaning = visibleChoices[index] ?? getQuestionChoiceText(question);
          return (
            <View key={question.word} style={styles.matchingRow}>
              <View style={styles.matchingCell}>
                <MatchingCard
                  text={question.word}
                  courseId={courseId}
                  variant="word"
                  pronunciation={
                    showPronunciationDetails && matchingMode !== "pronunciation"
                      ? question.pronunciation
                      : undefined
                  }
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
                  text={meaning}
                  courseId={courseId}
                  variant={
                    matchingMode === "pronunciation" ? "pronunciation" : "meaning"
                  }
                  isMatched={Object.values(matchedPairs).includes(meaning)}
                  isSelected={selectedMeaning === meaning}
                  isIncorrect={wrongMeaning === meaning}
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

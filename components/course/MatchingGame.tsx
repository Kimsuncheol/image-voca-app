import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { MatchingCard } from "./MatchingCard";

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
  courseColor?: string;
  isDark: boolean;
}

export function MatchingGame({
  questions,
  meanings: _unusedMeanings, // We derive meanings locally per page
  selectedWord,
  selectedMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  courseColor,
  isDark,
}: MatchingGameProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const currentQuestions = React.useMemo(() => {
    const start = currentPage * itemsPerPage;
    return questions.slice(start, start + itemsPerPage);
  }, [questions, currentPage]);

  // Shuffle meanings for the current page only
  const currentMeanings = React.useMemo(() => {
    const pageMeanings = currentQuestions.map((q) => q.meaning);
    // Fisher-Yates shuffle
    const shuffled = [...pageMeanings];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [currentQuestions]);

  const isPageComplete = currentQuestions.every((q) => matchedPairs[q.word]);

  // Auto-advance to next page when current page is complete
  React.useEffect(() => {
    if (isPageComplete && currentPage < totalPages - 1) {
      const timer = setTimeout(() => {
        setCurrentPage((p) => p + 1);
      }, 500); // 0.5s delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [isPageComplete, currentPage, totalPages]);

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t("quiz.matching.instructions")}{" "}
        {totalPages > 1 && `(${currentPage + 1}/${totalPages})`}
      </ThemedText>

      {/* combine word and meaning */}
      <View style={styles.matchingColumns}>
        <View style={styles.matchingColumn}>
          {currentQuestions.map((question) => {
            const isMatched = Boolean(matchedPairs[question.word]);
            const isSelected = selectedWord === question.word;
            return (
              <MatchingCard
                key={question.word}
                text={question.word}
                isMatched={isMatched}
                isSelected={isSelected}
                onPress={() => onSelectWord(question.word)}
                courseColor={courseColor}
                isDark={isDark}
              />
            );
          })}
        </View>

        <View style={styles.matchingColumn}>
          {currentMeanings.map((meaning) => {
            const isMatched = Object.values(matchedPairs).includes(meaning);
            const isSelected = selectedMeaning === meaning;
            return (
              <MatchingCard
                key={meaning}
                text={meaning}
                isMatched={isMatched}
                isSelected={isSelected}
                onPress={() => onSelectMeaning(meaning)}
                courseColor={courseColor}
                isDark={isDark}
              />
            );
          })}
        </View>
      </View>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <View style={styles.paginationDots}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: isDark ? "#333" : "#ddd" },
                i === currentPage && {
                  backgroundColor: courseColor || "#007AFF",
                },
              ]}
            />
          ))}
        </View>
      )}
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
  matchingColumns: {
    flexDirection: "row",
    gap: 16,
  },
  matchingColumn: {
    flex: 1,
    gap: 12,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

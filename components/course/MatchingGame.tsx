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
  meanings: _unusedMeanings,
  selectedWord,
  selectedMeaning,
  matchedPairs,
  onSelectWord,
  onSelectMeaning,
  courseColor,
  isDark,
}: MatchingGameProps) {
  const { t } = useTranslation();

  // Shuffle meanings once on mount
  const shuffledMeanings = React.useMemo(() => {
    const shuffled = questions.map((q) => q.meaning);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [questions]);

  return (
    <View style={styles.matchingContainer}>
      <ThemedText style={styles.matchingHint}>
        {t("quiz.matching.instructions")}
      </ThemedText>

      <View style={styles.matchingColumns}>
        <View style={styles.matchingColumn}>
          {questions.map((question) => (
            <MatchingCard
              key={question.word}
              text={question.word}
              isMatched={Boolean(matchedPairs[question.word])}
              isSelected={selectedWord === question.word}
              onPress={() => onSelectWord(question.word)}
              courseColor={courseColor}
              isDark={isDark}
            />
          ))}
        </View>

        <View style={styles.matchingColumn}>
          {shuffledMeanings.map((meaning) => (
            <MatchingCard
              key={meaning}
              text={meaning}
              isMatched={Object.values(matchedPairs).includes(meaning)}
              isSelected={selectedMeaning === meaning}
              onPress={() => onSelectMeaning(meaning)}
              courseColor={courseColor}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Pagination dots — one dot per question, filled when matched */}
      <View style={styles.paginationDots}>
        {questions.map((q) => (
          <View
            key={q.id}
            style={[
              styles.dot,
              {
                backgroundColor: matchedPairs[q.word]
                  ? courseColor || "#007AFF"
                  : isDark
                    ? "#333"
                    : "#ddd",
              },
            ]}
          />
        ))}
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

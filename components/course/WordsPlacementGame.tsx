import { BorderColors, getBorderColors } from "@/constants/borderColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { WordPlacementChunk } from "../../src/course/quizUtils";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface WordsPlacementGameProps {
  word: string;
  promptText?: string;
  targetExample: string;
  chunks: WordPlacementChunk[];
  translations?: string[];
  userAnswer: string;
  showResult: boolean;
  isCorrect: boolean;
  onAnswer: (answer: string) => void;
}

export const serializePlacementAnswer = (chunks: WordPlacementChunk[]) =>
  chunks.map((chunk) => chunk.id).join("|");

export const isWordsPlacementCorrect = (
  selectedChunks: WordPlacementChunk[],
  answerChunks: WordPlacementChunk[],
) => {
  const correctIds = [...answerChunks]
    .sort((a, b) => a.order - b.order)
    .map((chunk) => chunk.id);
  const selectedIds = selectedChunks.map((chunk) => chunk.id);

  return (
    selectedIds.length === correctIds.length &&
    selectedIds.every((id, index) => id === correctIds[index])
  );
};

const shuffleChunks = (chunks: WordPlacementChunk[]) => {
  const shuffled = [...chunks];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export function WordsPlacementGame({
  word,
  promptText,
  chunks,
  userAnswer,
  showResult,
  isCorrect,
  onAnswer,
}: WordsPlacementGameProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const borderColors = getBorderColors(isDark);
  const [selectedChunks, setSelectedChunks] = React.useState<
    WordPlacementChunk[]
  >([]);
  const shakeX = React.useRef(new Animated.Value(0)).current;
  const lastSubmittedAnswerRef = React.useRef<string | null>(null);
  const shuffledChunks = React.useMemo(() => shuffleChunks(chunks), [chunks]);

  React.useEffect(() => {
    setSelectedChunks([]);
    lastSubmittedAnswerRef.current = null;
  }, [chunks]);

  const selectedIds = React.useMemo(
    () => new Set(selectedChunks.map((chunk) => chunk.id)),
    [selectedChunks],
  );
  const availableChunks = shuffledChunks.filter(
    (chunk) => !selectedIds.has(chunk.id),
  );
  const serializedAnswer = React.useMemo(
    () => serializePlacementAnswer(selectedChunks),
    [selectedChunks],
  );
  const isComplete =
    chunks.length > 0 && selectedChunks.length === chunks.length;
  const isWrong = showResult && userAnswer && !isCorrect;

  React.useEffect(() => {
    if (!isComplete) {
      lastSubmittedAnswerRef.current = null;
      return;
    }
    if (showResult || lastSubmittedAnswerRef.current === serializedAnswer) {
      return;
    }

    const timeout = setTimeout(() => {
      lastSubmittedAnswerRef.current = serializedAnswer;
      onAnswer(serializedAnswer);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isComplete, onAnswer, serializedAnswer, showResult]);

  React.useEffect(() => {
    if (!isWrong) return;

    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isWrong, shakeX]);

  return (
    <View style={styles.container}>
      <Animated.View
        testID="words-placement-build-card"
        style={[
          styles.buildCard,
          {
            borderColor: isWrong
              ? borderColors.danger
              : borderColors.quizPlacementBuild,
          },
          isCorrect && showResult ? styles.correctBuildCard : undefined,
          { transform: [{ translateX: shakeX }] },
        ]}
      >
        <View
          testID="words-placement-prompt-section"
          style={[
            styles.promptSection,
            { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
          ]}
        >
          <ThemedText style={styles.promptLabel}>
            {t("quiz.types.wordsPlacement.prompt", {
              defaultValue: "Build a sentence with",
            })}
          </ThemedText>
          <ThemedText testID="words-placement-prompt" style={styles.wordText}>
            {promptText ?? word}
          </ThemedText>
        </View>

        <View style={styles.buildDivider} />

        <View
          testID="words-placement-answer-area"
          style={[
            styles.answerArea,
            { backgroundColor: isDark ? "#111" : "#fff" },
          ]}
        >
          <View style={styles.answerContent}>
            <ThemedText
              testID="words-placement-answer-instruction"
              style={styles.placeholderText}
            >
              {t("quiz.types.wordsPlacement.emptyAnswer", {
                defaultValue: "Tap chunks below to build the sentence",
              })}
            </ThemedText>
            {selectedChunks.length === 0 ? (
              <View
                testID="words-placement-empty-selection"
                style={styles.emptySelection}
              />
            ) : (
              <View style={styles.chipWrap}>
                {selectedChunks.map((chunk) => (
                  <Pressable
                    key={chunk.id}
                    testID={`words-placement-selected-${chunk.id}`}
                    disabled={showResult && isCorrect}
                    onPress={() =>
                      setSelectedChunks((prev) =>
                        prev.filter((selected) => selected.id !== chunk.id),
                      )
                    }
                    style={[
                      styles.chip,
                      styles.selectedChip,
                      { backgroundColor: isDark ? "#263247" : "#e8efff" },
                    ]}
                  >
                    <ThemedText style={styles.chipText}>
                      {chunk.text}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {isWrong ? (
        <ThemedText testID="words-placement-wrong" style={styles.wrongText}>
          {t("quiz.types.wordsPlacement.tryAgain", {
            defaultValue: "Try that order again.",
          })}
        </ThemedText>
      ) : null}

      {availableChunks.length > 0 ? (
        <View style={styles.choicesContainer}>
          <ThemedText style={styles.choicesLabel}>
            {t("quiz.types.wordsPlacement.chooseChunks", {
              defaultValue: "Sentence chunks",
            })}
          </ThemedText>
          <View style={styles.chipWrap}>
            {availableChunks.map((chunk) => (
              <Pressable
                key={chunk.id}
                testID={`words-placement-choice-${chunk.id}`}
                disabled={showResult}
                onPress={() => setSelectedChunks((prev) => [...prev, chunk])}
                style={[
                  styles.chip,
                  { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                ]}
              >
                <ThemedText style={styles.chipText}>{chunk.text}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    flex: 1,
  },
  buildCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  promptSection: {
    minHeight: 128,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 16,
    justifyContent: "center",
  },
  promptLabel: {
    fontSize: FontSizes.sm,
    opacity: 0.65,
  },
  wordText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.normal,
    textAlign: "left",
  },
  answerArea: {
    minHeight: 120,
    padding: 14,
    justifyContent: "center",
  },
  answerContent: {
    gap: 14,
  },
  buildDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.18)",
  },
  emptySelection: {
    minHeight: 42,
  },
  correctBuildCard: {
    borderColor: BorderColors.light.success,
  },
  placeholderText: {
    fontSize: FontSizes.body,
    opacity: 0.55,
    textAlign: "left",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BorderColors.light.quizPlacementChip,
  },
  selectedChip: {
    borderColor: BorderColors.light.quizPlacementSelectedChip,
  },
  chipText: {
    fontSize: FontSizes.body,
    lineHeight: 22,
  },
  wrongText: {
    color: "#dc3545",
    fontSize: FontSizes.body,
    textAlign: "center",
    fontWeight: FontWeights.semiBold,
  },
  choicesContainer: {
    gap: 10,
  },
  choicesLabel: {
    fontSize: FontSizes.body,
    opacity: 0.65,
  },
});

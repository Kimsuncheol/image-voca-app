import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
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
  targetExample,
  chunks,
  translations = [],
  userAnswer,
  showResult,
  isCorrect,
  onAnswer,
}: WordsPlacementGameProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedChunks, setSelectedChunks] = React.useState<
    WordPlacementChunk[]
  >([]);
  const shuffledChunks = React.useMemo(() => shuffleChunks(chunks), [chunks]);

  React.useEffect(() => {
    setSelectedChunks([]);
  }, [chunks]);

  const selectedIds = React.useMemo(
    () => new Set(selectedChunks.map((chunk) => chunk.id)),
    [selectedChunks],
  );
  const availableChunks = shuffledChunks.filter(
    (chunk) => !selectedIds.has(chunk.id),
  );
  const canSubmit = selectedChunks.length === chunks.length && !showResult;
  const isWrong = showResult && userAnswer && !isCorrect;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAnswer(serializePlacementAnswer(selectedChunks));
  };

  return (
    <View style={styles.container}>
      <View
        testID="words-placement-build-card"
        style={[
          styles.buildCard,
          {
            borderColor: isWrong ? "#dc3545" : isDark ? "#333" : "#d8d8d8",
          },
          isCorrect && showResult ? styles.correctBuildCard : undefined,
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
                    disabled={showResult}
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
      </View>

      {isCorrect && showResult ? (
        <View style={styles.revealContainer}>
          <ThemedText style={styles.revealLabel}>
            {t("quiz.types.wordsPlacement.answer", {
              defaultValue: "Sentence",
            })}
          </ThemedText>
          <ThemedText style={styles.revealText}>{targetExample}</ThemedText>
          {translations.length > 0 ? (
            <View
              testID="words-placement-translations"
              style={styles.translationsContainer}
            >
              {translations.map((translation, index) => (
                <ThemedText
                  key={`${translation}-${index}`}
                  style={styles.translationText}
                >
                  {translation}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {isWrong ? (
        <ThemedText testID="words-placement-wrong" style={styles.wrongText}>
          {t("quiz.types.wordsPlacement.tryAgain", {
            defaultValue: "Try that order again.",
          })}
        </ThemedText>
      ) : null}

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

      <Pressable
        testID="words-placement-submit"
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[
          styles.submitButton,
          { backgroundColor: canSubmit ? "#007AFF" : "#9CA3AF" },
        ]}
      >
        <ThemedText style={styles.submitText}>
          {t("common.submit", { defaultValue: "Submit" })}
        </ThemedText>
      </Pressable>
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
    textAlign: "center",
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
    borderColor: "#28a745",
  },
  placeholderText: {
    fontSize: FontSizes.body,
    opacity: 0.55,
    textAlign: "center",
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
    borderColor: "rgba(128,128,128,0.24)",
  },
  selectedChip: {
    borderColor: "#7C9CFF",
  },
  chipText: {
    fontSize: FontSizes.body,
    lineHeight: 22,
  },
  revealContainer: {
    gap: 4,
    paddingHorizontal: 2,
  },
  revealLabel: {
    fontSize: FontSizes.sm,
    opacity: 0.6,
  },
  revealText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
  },
  translationsContainer: {
    gap: 4,
    marginTop: 4,
  },
  translationText: {
    fontSize: FontSizes.body,
    opacity: 0.72,
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
  submitButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
  },
});

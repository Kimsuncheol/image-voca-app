/**
 * ====================================
 * WORD ARRANGEMENT QUIZ COMPONENT
 * ====================================
 *
 * Displays shuffled words for user to arrange into the correct sentence.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";

interface QuizItem {
  word: string;
  meaning: string;
  translation?: string;
}

interface WordArrangementQuizProps {
  quizItem: QuizItem;
  shuffledChunks: string[];
  selectedChunks: string[];
  prefilledSpeaker: string | null;
  isDark: boolean;
  onChunkSelect: (chunk: string, index: number) => void;
  onChunkDeselect: (index: number) => void;
}

export function WordArrangementQuiz({
  quizItem,
  shuffledChunks,
  selectedChunks,
  prefilledSpeaker,
  isDark,
  onChunkSelect,
  onChunkDeselect,
}: WordArrangementQuizProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Question */}
      <View style={styles.question}>
        <ThemedText style={styles.questionLabel}>
          {t("dashboard.popQuiz.wordArrangement", {
            defaultValue: "Arrange the words",
          })}
        </ThemedText>
        {quizItem.translation && (
          <ThemedText style={styles.translation}>
            {quizItem.translation}
          </ThemedText>
        )}
      </View>

      {/* Selected chunks area */}
      <View style={styles.arrangementArea}>
        <ThemedText style={styles.arrangementLabel}>
          {t("dashboard.popQuiz.yourAnswer", {
            defaultValue: "Your answer:",
          })}
        </ThemedText>
        <View style={styles.selectedChunksContainer}>
          {selectedChunks.length === 0 ? (
            <ThemedText style={styles.placeholder}>
              {t("dashboard.popQuiz.tapWordsBelow", {
                defaultValue: "Tap words below to arrange",
              })}
            </ThemedText>
          ) : (
            selectedChunks.map((chunk, index) => {
              const isPrefilled = prefilledSpeaker && chunk === prefilledSpeaker;

              return (
                <TouchableOpacity
                  key={`selected-${index}`}
                  style={[
                    styles.chunk,
                    styles.selectedChunk,
                    {
                      backgroundColor: isPrefilled
                        ? "#666"
                        : isDark
                          ? "#007AFF"
                          : "#007AFF",
                    },
                  ]}
                  onPress={() => onChunkDeselect(index)}
                  disabled={isPrefilled}
                >
                  <ThemedText style={styles.selectedChunkText}>
                    {chunk}
                  </ThemedText>
                  {isPrefilled && (
                    <ThemedText style={styles.lockIcon}> 🔒</ThemedText>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Available chunks */}
      <View style={styles.arrangementArea}>
        <ThemedText style={styles.arrangementLabel}>
          {t("dashboard.popQuiz.availableWords", {
            defaultValue: "Available words:",
          })}
        </ThemedText>
        <View style={styles.shuffledChunksContainer}>
          {shuffledChunks.map((chunk, index) => (
            <TouchableOpacity
              key={`shuffled-${index}`}
              style={[
                styles.chunk,
                { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
              ]}
              onPress={() => onChunkSelect(chunk, index)}
            >
              <ThemedText style={styles.chunkText}>{chunk}</ThemedText>
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
  translation: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 8,
  },
  arrangementArea: {
    marginBottom: 16,
  },
  arrangementLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectedChunksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 60,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF40",
    borderStyle: "dashed",
  },
  shuffledChunksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.4,
    fontStyle: "italic",
  },
  chunk: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedChunk: {
    borderColor: "#007AFF",
  },
  chunkText: {
    fontSize: 14,
  },
  selectedChunkText: {
    fontSize: 14,
    color: "#fff",
  },
  lockIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
});

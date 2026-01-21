import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { WordArrangementChunk } from "./WordArrangementChunk";

interface WordArrangementAnswerZoneProps {
  selectedChunksByArea: string[][];
  isComplete: boolean;
  sentenceChunkCounts?: number[];
  onChunkDeselect: (areaIndex: number, chunkIndex: number) => void;
  translation?: string;
  focusedSentenceIndex?: number;
  onFocusChange?: (index: number) => void;
}

export function WordArrangementAnswerZone({
  selectedChunksByArea,
  isComplete,
  sentenceChunkCounts,
  onChunkDeselect,
  translation,
  focusedSentenceIndex = 0,
  onFocusChange,
}: WordArrangementAnswerZoneProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const counts = sentenceChunkCounts || [];
  const showMultiple = counts.length > 1;

  // Split translations by newlines
  const translations = translation
    ? translation.split("\n").filter((t) => t.trim())
    : [];

  console.log("[Arrangement] Raw Translation:", translation);
  console.log("[Arrangement] Parsed Translations:", translations);

  const handleSentenceFocus = (index: number) => {
    if (onFocusChange && !isComplete) {
      onFocusChange(index);
    }
  };

  const getFocusedStyle = (sentenceIndex: number) => {
    if (!showMultiple || isComplete) return {};
    if (sentenceIndex === focusedSentenceIndex) {
      return {
        backgroundColor: isDark ? "#2a2a2c" : "#e8e8ed",
        borderRadius: 8,
        marginHorizontal: -8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      };
    }
    return {};
  };

  return (
    <View
      style={[
        styles.answerZone,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        isComplete && styles.answerZoneComplete,
      ]}
    >
      <ThemedText style={styles.zoneLabel}>
        {t("quiz.wordArrangement.yourSentence")}
      </ThemedText>
      <View style={styles.sentences}>
        {selectedChunksByArea.map((areaChunks, areaIndex) => (
          <TouchableOpacity
            key={`sentence-${areaIndex}`}
            style={[styles.sentenceContainer, getFocusedStyle(areaIndex)]}
            onPress={() => handleSentenceFocus(areaIndex)}
            activeOpacity={isComplete ? 1 : 0.7}
            disabled={isComplete}
          >
            <View style={styles.sentenceRow}>
              {showMultiple && (
                <ThemedText
                  style={[
                    styles.sentenceIndex,
                    areaIndex === focusedSentenceIndex &&
                      !isComplete &&
                      styles.sentenceIndexFocused,
                  ]}
                >
                  {areaIndex + 1}.
                </ThemedText>
              )}
              <View style={styles.chunksRow}>
                {areaChunks.length === 0 ? (
                  <ThemedText style={styles.placeholder}>
                    {t("quiz.wordArrangement.tapToRemove")}
                  </ThemedText>
                ) : (
                  areaChunks.map((chunk, chunkIndex) => (
                    <WordArrangementChunk
                      key={`selected-${areaIndex}-${chunkIndex}`}
                      chunk={chunk}
                      onPress={() => onChunkDeselect(areaIndex, chunkIndex)}
                      selected
                      complete={isComplete}
                      disabled={isComplete}
                    />
                  ))
                )}
              </View>
            </View>
            {/* Show translation always */}
            {translations[areaIndex] && (
              <ThemedText
                style={[
                  styles.translationText,
                  { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                ]}
              >
                {translations[areaIndex].trim()}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  answerZone: {
    minHeight: 80,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  answerZoneComplete: {
    borderColor: "#28a745",
    backgroundColor: "#28a74510",
  },
  zoneLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sentences: {
    gap: 12,
  },
  sentenceContainer: {
    gap: 6,
  },
  sentenceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  sentenceIndex: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
  },
  sentenceIndexFocused: {
    opacity: 1,
    fontWeight: "600",
  },
  chunksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.4,
    fontStyle: "italic",
  },
  translationText: {
    fontSize: 14,
    fontStyle: "italic",
    marginLeft: 21,
    opacity: 0.9,
  },
});

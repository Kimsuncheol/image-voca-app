import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { WordArrangementChunk } from "./WordArrangementChunk";

interface WordArrangementAnswerZoneProps {
  selectedChunks: string[];
  isComplete: boolean;
  sentenceChunkCounts?: number[];
  onChunkDeselect: (index: number) => void;
}

const splitSelectedChunksBySentence = (
  chunks: string[],
  counts: number[],
): string[][] => {
  if (counts.length === 0) return [chunks];
  const groups: string[][] = [];
  let cursor = 0;
  counts.forEach((count) => {
    groups.push(chunks.slice(cursor, cursor + count));
    cursor += count;
  });
  return groups;
};

export function WordArrangementAnswerZone({
  selectedChunks,
  isComplete,
  sentenceChunkCounts,
  onChunkDeselect,
}: WordArrangementAnswerZoneProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const counts = sentenceChunkCounts || [];
  const chunkGroups = splitSelectedChunksBySentence(selectedChunks, counts);
  const showMultiple = counts.length > 1;
  const groupOffsets: number[] = [];
  let runningOffset = 0;
  chunkGroups.forEach((group) => {
    groupOffsets.push(runningOffset);
    runningOffset += group.length;
  });

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
        {chunkGroups.map((chunks, sentenceIndex) => (
          <View key={`sentence-${sentenceIndex}`} style={styles.sentenceRow}>
            {showMultiple && (
              <ThemedText style={styles.sentenceIndex}>
                {sentenceIndex + 1}.
              </ThemedText>
            )}
            <View style={styles.chunksRow}>
              {chunks.length === 0 ? (
                <ThemedText style={styles.placeholder}>
                  {t("quiz.wordArrangement.tapToRemove")}
                </ThemedText>
              ) : (
                chunks.map((chunk, chunkIndex) => (
                  <WordArrangementChunk
                    key={`selected-${sentenceIndex}-${chunkIndex}`}
                    chunk={chunk}
                    onPress={() =>
                      onChunkDeselect(
                        groupOffsets[sentenceIndex] + chunkIndex,
                      )
                    }
                    selected
                    complete={isComplete}
                    disabled={isComplete}
                  />
                ))
              )}
            </View>
          </View>
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
  chunksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  placeholder: {
    fontSize: 14,
    opacity: 0.4,
    fontStyle: "italic",
  },
});

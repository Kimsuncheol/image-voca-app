import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { WordArrangementAnswerZone } from "./WordArrangementAnswerZone";
import { WordArrangementAvailableChunks } from "./WordArrangementAvailableChunks";
import { WordArrangementComplete } from "./WordArrangementComplete";
import { WordArrangementInstructions } from "./WordArrangementInstructions";
import { WordArrangementTargetCard } from "./WordArrangementTargetCard";

interface WordArrangementGameProps {
  word: string;
  meaning: string;
  selectedChunks: string[];
  availableChunks: string[];
  isComplete: boolean;
  sentenceChunkCounts?: number[];
  courseColor?: string;
  onChunkSelect: (chunk: string, index: number) => void;
  onChunkDeselect: (index: number) => void;
  onNext: () => void;
}

export function WordArrangementGame({
  word,
  meaning,
  selectedChunks,
  availableChunks,
  isComplete,
  sentenceChunkCounts,
  courseColor,
  onChunkSelect,
  onChunkDeselect,
  onNext,
}: WordArrangementGameProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <WordArrangementTargetCard word={word} meaning={meaning} />

      <WordArrangementInstructions
        text={t("quiz.wordArrangement.instructions")}
      />

      <WordArrangementAnswerZone
        selectedChunks={selectedChunks}
        isComplete={isComplete}
        sentenceChunkCounts={sentenceChunkCounts}
        onChunkDeselect={onChunkDeselect}
      />

      {!isComplete && (
        <WordArrangementAvailableChunks
          chunks={availableChunks}
          onChunkSelect={onChunkSelect}
        />
      )}

      {isComplete && (
        <WordArrangementComplete onNext={onNext} courseColor={courseColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 24,
  },
});

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
  translation?: string;
  selectedChunksByArea: string[][];
  availableChunks: string[];
  isComplete: boolean;
  sentenceChunkCounts?: number[];
  courseColor?: string;
  focusedSentenceIndex?: number;
  onFocusChange?: (index: number) => void;
  onChunkSelect: (chunk: string, index: number) => void;
  onChunkDeselect: (areaIndex: number, chunkIndex: number) => void;
  onNext: () => void;
}

export function WordArrangementGame({
  word,
  meaning,
  translation,
  selectedChunksByArea,
  availableChunks,
  isComplete,
  sentenceChunkCounts,
  courseColor,
  focusedSentenceIndex = 0,
  onFocusChange,
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
        selectedChunksByArea={selectedChunksByArea}
        isComplete={isComplete}
        sentenceChunkCounts={sentenceChunkCounts}
        onChunkDeselect={onChunkDeselect}
        translation={translation}
        focusedSentenceIndex={focusedSentenceIndex}
        onFocusChange={onFocusChange}
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

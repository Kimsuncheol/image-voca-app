import React from "react";
import { StyleSheet, View } from "react-native";
import { WordArrangementChunk } from "./WordArrangementChunk";

interface WordArrangementAvailableChunksProps {
  chunks: string[];
  onChunkSelect: (chunk: string, index: number) => void;
}

export function WordArrangementAvailableChunks({
  chunks,
  onChunkSelect,
}: WordArrangementAvailableChunksProps) {
  if (chunks.length === 0) return null;

  return (
    <View style={styles.availableZone}>
      <View style={styles.chunksRow}>
        {chunks.map((chunk, index) => (
          <WordArrangementChunk
            key={`available-${index}`}
            chunk={chunk}
            onPress={() => onChunkSelect(chunk, index)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  availableZone: {
    marginTop: 8,
  },
  chunksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});

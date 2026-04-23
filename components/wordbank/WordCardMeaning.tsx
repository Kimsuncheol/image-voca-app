import React from "react";
import { StyleSheet } from "react-native";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";

interface WordCardMeaningProps {
  meaning: string;
  courseId?: string;
  isDark: boolean;
  hasPronunciation?: boolean;
}

/**
 * Meaning section of the word card
 * Displays the definition of the word
 */
export function WordCardMeaning({
  meaning,
  courseId,
  isDark,
  hasPronunciation = false,
}: WordCardMeaningProps) {
  return (
    <InlineMeaningWithChips
      meaning={meaning}
      courseId={courseId}
      isDark={isDark}
      textStyle={styles.meaning}
      containerStyle={[
        styles.container,
        hasPronunciation && styles.containerAfterPronunciation,
      ]}
      chipStyle={styles.inlineChip}
      testID="inline-meaning"
      splitPosSegmentsIntoRows
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  containerAfterPronunciation: {
    marginTop: 8,
  },
  inlineChip: {
    marginRight: 4,
  },
  meaning: {
    fontSize: 15,
    lineHeight: 22,
  },
});

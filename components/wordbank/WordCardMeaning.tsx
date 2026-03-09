import React from "react";
import { StyleSheet } from "react-native";
import { InlineMeaningWithChips } from "../common/InlineMeaningWithChips";

interface WordCardMeaningProps {
  meaning: string;
  isDark: boolean;
}

/**
 * Meaning section of the word card
 * Displays the definition of the word
 */
export function WordCardMeaning({ meaning, isDark }: WordCardMeaningProps) {
  return (
    <InlineMeaningWithChips
      meaning={meaning}
      isDark={isDark}
      textStyle={styles.meaning}
      containerStyle={styles.container}
      chipStyle={styles.inlineChip}
      testID="inline-meaning"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  inlineChip: {
    marginRight: 6,
  },
  meaning: {
    fontSize: 15,
    lineHeight: 22,
  },
});

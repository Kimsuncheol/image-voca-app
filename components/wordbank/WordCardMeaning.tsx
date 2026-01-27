import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";

interface WordCardMeaningProps {
  meaning: string;
}

/**
 * Meaning section of the word card
 * Displays the definition of the word
 */
export function WordCardMeaning({ meaning }: WordCardMeaningProps) {
  return <ThemedText style={styles.meaning}>{meaning}</ThemedText>;
}

const styles = StyleSheet.create({
  meaning: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface WordCardExampleProps {
  example: string;
  translation?: string;
}

/**
 * Example section of the word card
 * Displays the example sentence and optional translation
 */
export function WordCardExample({
  example,
  translation,
}: WordCardExampleProps) {
  return (
    <View style={styles.exampleContainer}>
      <ThemedText style={styles.example}>{`"${example}"`}</ThemedText>
      {translation && (
        <ThemedText style={styles.translation}>{translation}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  exampleContainer: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 4,
  },
  example: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
    fontStyle: "italic",
  },
});

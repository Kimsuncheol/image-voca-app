import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface WordCardHeaderProps {
  word: string;
  day?: number;
  pronunciation?: string;
}

/**
 * Header section of the word card
 * Displays the word title, optional day badge, and pronunciation
 */
export function WordCardHeader({
  word,
  day,
  pronunciation,
}: WordCardHeaderProps) {
  return (
    <View style={styles.wordHeader}>
      <View style={styles.wordTitleContainer}>
        <ThemedText type="subtitle" style={styles.wordTitle}>
          {word}
        </ThemedText>
        {day && <ThemedText style={styles.dayBadge}>Day {day}</ThemedText>}
      </View>
      {pronunciation && (
        <ThemedText style={styles.pronunciation}>{pronunciation}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wordHeader: {
    flex: 1,
  },
  wordTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  wordTitle: {
    fontSize: 22,
  },
  dayBadge: {
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  pronunciation: {
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.6,
    marginTop: 2,
  },
});

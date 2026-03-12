import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { parseWordVariants } from "../../src/utils/wordVariants";
import { ThemedText } from "../themed-text";

interface WordCardHeaderProps {
  word: string;
  day?: number;
  pronunciation?: string;
  onSpeak?: () => void;
  onLongPress?: () => void;
}

/**
 * Header section of the word card
 * Displays the word title, optional day badge, and pronunciation
 */
export function WordCardHeader({
  word,
  day,
  pronunciation,
  onSpeak,
  onLongPress,
}: WordCardHeaderProps) {
  const wordVariants = React.useMemo(() => parseWordVariants(word), [word]);
  const isMultilineWord = wordVariants.length > 1;
  const titleContent = (
    <View style={styles.wordTitleTextContainer}>
      {wordVariants.map((variant, index) => (
        <ThemedText
          key={`${variant}-${index}`}
          type="subtitle"
          style={[styles.wordTitle, isMultilineWord && styles.wordTitleMultiline]}
          numberOfLines={isMultilineWord ? undefined : 1}
        >
          {variant}
        </ThemedText>
      ))}
    </View>
  );
  const canInteract = Boolean(onSpeak || onLongPress);

  return (
    <View style={styles.wordHeader}>
      <View style={styles.wordTitleContainer}>
        {canInteract ? (
          <TouchableOpacity
            onPress={onSpeak}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.wordTitleButton}
            accessibilityRole={onSpeak ? "button" : undefined}
          >
            {titleContent}
          </TouchableOpacity>
        ) : (
          titleContent
        )}
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
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  wordTitleButton: {
    flexShrink: 1,
    minWidth: 0,
  },
  wordTitleTextContainer: {
    flexShrink: 1,
    minWidth: 0,
  },
  wordTitle: {
    fontSize: 22,
    flexShrink: 1,
  },
  wordTitleMultiline: {
    lineHeight: 28,
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

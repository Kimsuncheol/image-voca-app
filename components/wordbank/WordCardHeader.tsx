import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  formatIdiomTitleForDisplay,
  getIdiomTitleFontSize,
} from "../../src/utils/idiomDisplay";
import { parseWordVariants } from "../../src/utils/wordVariants";
import { DayBadge } from "../common/DayBadge";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

interface WordCardHeaderProps {
  word: string;
  courseId?: string;
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
  courseId,
  day,
  pronunciation,
  onSpeak,
  onLongPress,
}: WordCardHeaderProps) {
  const wordVariants = React.useMemo(
    () =>
      parseWordVariants(word).map((variant) =>
        formatIdiomTitleForDisplay(variant, courseId),
      ),
    [courseId, word],
  );
  const isMultilineWord = wordVariants.length > 1;
  const longestVariant = React.useMemo(
    () =>
      wordVariants
        .flatMap((variant) => variant.split("\n"))
        .reduce(
          (longest, line) => (line.length > longest.length ? line : longest),
          wordVariants[0] ?? word,
        ),
    [word, wordVariants],
  );
  const titleFontSize = React.useMemo(
    () => getIdiomTitleFontSize(longestVariant, courseId, 22),
    [courseId, longestVariant],
  );
  const titleLineHeight = React.useMemo(
    () => Math.round(titleFontSize * 1.25),
    [titleFontSize],
  );
  const titleContent = (
    <View style={styles.wordTitleTextContainer}>
      {wordVariants.map((variant, index) => {
        const hasDisplayLineBreak = variant.includes("\n");

        return (
          <ThemedText
            key={`${variant}-${index}`}
            type="subtitle"
            testID={index === 0 ? "word-card-title" : undefined}
            style={[
              styles.wordTitle,
              isMultilineWord && styles.wordTitleMultiline,
              { fontSize: titleFontSize, lineHeight: titleLineHeight },
            ]}
            numberOfLines={
              isMultilineWord || hasDisplayLineBreak ? undefined : 1
            }
          >
            {variant}
          </ThemedText>
        );
      })}
    </View>
  );
  const canInteract = Boolean(onSpeak || onLongPress);

  return (
    <View style={styles.wordHeader}>
      <View style={styles.wordTitleContainer}>
        <View style={styles.wordTitleContent}>
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
        </View>
        {day && (
          <View style={styles.wordHeaderRight}>
            <DayBadge day={day} />
          </View>
        )}
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
    minWidth: 0,
  },
  wordTitleContent: {
    flex: 1,
    minWidth: 0,
  },
  wordHeaderRight: {
    flexShrink: 0,
    marginLeft: "auto",
  },
  wordTitleButton: {
    flex: 1,
    minWidth: 0,
  },
  wordTitleTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  wordTitle: {
    fontSize: FontSizes.titleLg,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  wordTitleMultiline: {
    lineHeight: LineHeights.headingMd,
  },
  pronunciation: {
    fontSize: FontSizes.body,
    opacity: 0.6,
    marginTop: 2,
  },
});

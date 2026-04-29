import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../src/hooks/useSpeech";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../src/utils/japaneseText";
import { toDialogueTurns } from "../../src/utils/roleplayUtils";
import { formatSynonyms } from "../../src/utils/synonyms";
import { ThemedText } from "../themed-text";

const LEGACY_COLLAPSE_THRESHOLD = 4;
const COLLAPSED_VISIBLE_COUNT = 3;
const CHARACTER_MIN_WIDTH = 88;
const CHARACTER_MAX_WIDTH = 120;
const CHARACTER_WIDTH_PER_CHAR = 8;
const CHARACTER_BASE_WIDTH = 20;

function splitExampleLines(content?: string): string[] {
  return content
    ? content
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    : [];
}

function splitCharacterWords(character: string): string[] {
  return character.trim().split(/\s+/).filter(Boolean);
}

function formatCharacterLabel(character: string): string {
  return splitCharacterWords(character).join("\n");
}

interface WordCardExampleProps {
  example: string;
  exampleFurigana?: string;
  translation?: string;
  synonyms?: string[];
  pronunciation?: string;
  course?: string;
  isDark?: boolean;
  speakLanguage?: string;
  expandToContent?: boolean;
  showKana?: boolean;
}

export function WordCardExample({
  example,
  exampleFurigana,
  translation,
  synonyms,
  pronunciation,
  course,
  isDark = false,
  speakLanguage = "en-US",
  expandToContent = false,
  showKana = true,
}: WordCardExampleProps) {
  const { speak } = useSpeech();
  useCardSpeechCleanup();
  const { t } = useTranslation();
  const isCollocation = course === "COLLOCATION";
  const [isExpanded, setIsExpanded] = React.useState(false);
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  const processedExample = React.useMemo(
    () => (showKana ? example : stripKanaParens(example)),
    [example, showKana],
  );
  const examples = React.useMemo(
    () => splitExampleLines(processedExample),
    [processedExample],
  );
  const furiganaLines = React.useMemo(
    () => splitExampleLines(exampleFurigana),
    [exampleFurigana],
  );
  const translations = React.useMemo(
    () => splitExampleLines(translation),
    [translation],
  );
  const formattedSynonyms = React.useMemo(
    () => (course === "TOEFL_IELTS" ? formatSynonyms(synonyms) : undefined),
    [course, synonyms],
  );

  const exampleTurns = React.useMemo(
    () => (isCollocation ? toDialogueTurns(example) : []),
    [example, isCollocation],
  );
  const translationTurns = React.useMemo(
    () => (isCollocation ? toDialogueTurns(translation || "") : []),
    [isCollocation, translation],
  );
  const furiganaTurns = React.useMemo(
    () => (isCollocation ? toDialogueTurns(exampleFurigana || "") : []),
    [exampleFurigana, isCollocation],
  );

  const collocationItems = React.useMemo(
    () =>
      exampleTurns.map((turn, index) => ({
        character: turn.role || "",
        characterLabel: formatCharacterLabel(turn.role || ""),
        exampleText: turn.text,
        speakText: furiganaTurns[index]?.text || turn.text,
        translationText: translationTurns[index]?.text || "",
      })),
    [exampleTurns, furiganaTurns, translationTurns],
  );

  const characterColumnWidth = React.useMemo(() => {
    const longestWordLength = collocationItems.reduce((maxLength, item) => {
      const longestInItem = splitCharacterWords(item.character).reduce(
        (innerMax, word) => Math.max(innerMax, word.length),
        0,
      );
      return Math.max(maxLength, longestInItem);
    }, 0);

    const estimatedWidth =
      longestWordLength * CHARACTER_WIDTH_PER_CHAR + CHARACTER_BASE_WIDTH;

    return Math.max(
      CHARACTER_MIN_WIDTH,
      Math.min(CHARACTER_MAX_WIDTH, estimatedWidth),
    );
  }, [collocationItems]);

  const shouldCollapseStandard =
    !isCollocation &&
    !expandToContent &&
    examples.length >= LEGACY_COLLAPSE_THRESHOLD;
  const displayedExamples =
    shouldCollapseStandard && !isExpanded
      ? examples.slice(0, COLLAPSED_VISIBLE_COUNT)
      : examples;
  const shouldCollapseCollocation =
    isCollocation && collocationItems.length > COLLAPSED_VISIBLE_COUNT;
  const displayedCollocationItems =
    shouldCollapseCollocation && !isExpanded
      ? collocationItems.slice(0, COLLAPSED_VISIBLE_COUNT)
      : collocationItems;

  const handleSpeak = React.useCallback(
    async (text: string) => {
      try {
        await speak(text, { language: speakLanguage, pitch: 1.0 });
      } catch (error) {
        console.error("TTS error:", error);
      }
    },
    [speak, speakLanguage],
  );

  const renderMeta = () => (
    <>
      {pronunciation ? (
        <ThemedText
          style={[
            styles.metaText,
            { color: fontColors.learningCardMuted },
          ]}
        >
          {`${t("notifications.labels.pronunciation", {
            defaultValue: "Pronunciation",
          })}: ${pronunciation}`}
        </ThemedText>
      ) : null}
    </>
  );

  const renderSynonyms = () =>
    formattedSynonyms ? (
      <View testID="word-card-synonyms-section" style={styles.exampleGroup}>
        <ThemedText
          style={[
            styles.metaText,
            {
              color: fontColors.learningCardMuted,
              textTransform: "uppercase",
              fontWeight: FontWeights.bold,
            },
          ]}
        >
          {`${t("notifications.labels.synonyms", {
            defaultValue: "Synonyms",
          })}`}
        </ThemedText>
        <ThemedText
          testID="word-card-synonyms"
          style={[
            styles.synonyms,
            { color: fontColors.learningCardSecondary },
          ]}
        >
          {formattedSynonyms}
        </ThemedText>
      </View>
    ) : null;

  const renderStandardContent = () =>
    displayedExamples.map((exampleText, index) => {
      const segments = splitJapaneseTextSegments(exampleText.trim());
      return (
        <View key={index} style={styles.exampleGroup}>
          <TouchableOpacity
            onPress={() =>
              handleSpeak((furiganaLines[index] ?? exampleText).trim())
            }
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.example,
                { color: fontColors.learningCardPrimary },
              ]}
            >
              {segments.map((segment, segIndex) =>
                segment.isKanaParen ? (
                  <Text
                    key={segIndex}
                    style={[
                      styles.exampleFurigana,
                      { color: fontColors.learningCardMuted },
                    ]}
                  >
                    {segment.text}
                  </Text>
                ) : (
                  <Text key={segIndex}>{segment.text}</Text>
                ),
              )}
            </ThemedText>
          </TouchableOpacity>
          {translations[index] ? (
            <ThemedText
              testID={index === 0 ? "word-card-translation" : undefined}
              style={[styles.translation, { color: fontColors.translation }]}
            >
              {translations[index].trim()}
            </ThemedText>
          ) : null}
        </View>
      );
    });

  const renderCollocationContent = () => (
    <View style={styles.collocationList}>
      {displayedCollocationItems.map((item, index) => (
        <View key={`collocation-item-${index}`} style={styles.collocationItem}>
          <View style={styles.collocationRow}>
            {item.character ? (
              <View
                style={[
                  styles.characterColumn,
                  { width: characterColumnWidth },
                ]}
              >
                <View
                  style={[
                    styles.characterChip,
                    { backgroundColor: bgColors.learningCardChip },
                  ]}
                >
                  <ThemedText
                style={[
                  styles.characterText,
                  { color: fontColors.learningCardChipText },
                ]}
                  >
                    {item.characterLabel}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View
                testID="word-card-collocation-empty-character-cell"
                style={[
                  styles.characterColumn,
                  { width: characterColumnWidth },
                ]}
              />
            )}
            <View
              testID="word-card-collocation-content-cell"
              style={styles.contentColumn}
            >
              <TouchableOpacity
                onPress={() => handleSpeak(item.speakText.trim())}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.example,
                    { color: fontColors.learningCardPrimary },
                  ]}
                >
                  {item.exampleText.trim()}
                </ThemedText>
              </TouchableOpacity>
              {item.translationText ? (
                <ThemedText
                  testID={
                    index === 0
                      ? "word-card-collocation-translation"
                      : undefined
                  }
                  style={[
                    styles.translation,
                    { color: fontColors.translation },
                  ]}
                >
                  {item.translationText.trim()}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  if (isCollocation) {
    return (
      <View>
        <View testID="word-card-example-content" style={styles.container}>
          {renderMeta()}
          {renderCollocationContent()}
        </View>
        {shouldCollapseCollocation ? (
          <TouchableOpacity
            testID="word-card-example-toggle"
            style={[
              styles.collocationToggle,
              {
                backgroundColor: bgColors.learningCardExpandButton,
                borderColor: fontColors.learningCardDividerMuted,
              },
            ]}
            onPress={() => setIsExpanded((current) => !current)}
            activeOpacity={0.7}
          >
            <ThemedText
            style={[
              styles.collocationToggleText,
              { color: fontColors.learningCardActionText },
            ]}
            >
              {isExpanded
                ? t("common.collapse", { defaultValue: "Collapse" })
                : t("common.expand", { defaultValue: "Expand" })}
            </ThemedText>
          </TouchableOpacity>
        ) : null}
        {renderSynonyms()}
      </View>
    );
  }

  const standardContent = (
    <>
      {renderMeta()}
      {renderStandardContent()}
      {renderSynonyms()}
    </>
  );

  return (
    <>
      {expandToContent ? (
        <View testID="word-card-example-content" style={styles.container}>
          {standardContent}
        </View>
      ) : (
        <ScrollView
          testID="word-card-example-scroll"
          style={[styles.container, styles.containerCapped]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {standardContent}
        </ScrollView>
      )}

      {shouldCollapseStandard ? (
        <TouchableOpacity
          style={[
            styles.expandButton,
            { backgroundColor: bgColors.learningCardExpandButton },
          ]}
          onPress={() => setIsExpanded((current) => !current)}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.expandButtonText,
              { color: fontColors.learningCardActionText },
            ]}
          >
            {isExpanded
              ? "Show less"
              : `Show ${examples.length - COLLAPSED_VISIBLE_COUNT} more`}
          </ThemedText>
        </TouchableOpacity>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  containerCapped: {
    maxHeight: 200,
  },
  exampleGroup: {
    marginTop: 8,
  },
  metaText: {
    fontSize: FontSizes.body,
    lineHeight: LineHeights.bodyLg,
    opacity: 0.72,
    marginTop: 6,
  },
  example: {
    fontSize: FontSizes.bodyLg,
    lineHeight: LineHeights.titleLg,
    opacity: 0.8,
    flexShrink: 1,
    fontWeight: FontWeights.medium,
  },
  exampleFurigana: {
    fontSize: FontSizes.caption,
  },
  translation: {
    fontSize: FontSizes.caption,
    lineHeight: LineHeights.bodyXl,
    marginTop: 4,
    opacity: 0.92,
    flexShrink: 1,
    fontWeight: FontWeights.medium,
  },
  synonyms: {
    fontSize: FontSizes.bodyMd,
    lineHeight: LineHeights.bodyXl,
    marginTop: 4,
    fontWeight: FontWeights.regular,
  },
  expandButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  expandButtonText: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.semiBold,
  },
  collocationList: {
    gap: 10,
    marginTop: 8,
  },
  collocationItem: {
    gap: 4,
  },
  collocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  characterColumn: {
    paddingRight: 10,
  },
  characterChip: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  characterText: {
    fontSize: FontSizes.label,
    lineHeight: LineHeights.bodyLg,
    fontWeight: FontWeights.semiBold,
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  collocationToggle: {
    alignSelf: "stretch",
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
  },
  collocationToggleText: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.semiBold,
    letterSpacing: 0.1,
    textAlign: "center",
  },
});

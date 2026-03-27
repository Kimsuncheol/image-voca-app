import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useSpeech } from "../../../src/hooks/useSpeech";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { resolveVocabularyContent } from "../../../src/utils/localizedVocabulary";
import { InlineMeaningWithChips } from "../../common/InlineMeaningWithChips";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { SwipeCardItemImageSection } from "../../swipe/SwipeCardItemImageSection";

const { width } = Dimensions.get("window");

const WORD_TTS_OPTIONS = {
  language: "en-US",
  rate: 0.9,
} as const;

// Matches hiragana/katakana inside full-width or half-width parentheses
const KANA_PARENS_REGEX = /[（(][\u3040-\u30FF\u30FC]+[）)]/g;

function stripKanaParens(text: string): string {
  return text.replace(KANA_PARENS_REGEX, "").replace(/\s{2,}/g, " ").trim();
}

interface JlptVocabularyCardProps {
  item: VocabularyCard;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  showKana?: boolean;
  onToggleKana?: () => void;
}

interface LabeledMeaningRowProps {
  testID: string;
  meaning?: string;
  isDark: boolean;
}

interface ExampleBlockProps {
  example?: string;
  exampleRoman?: string;
  translation?: string;
  isDark: boolean;
  showKana: boolean;
}

const toDisplayValue = (value?: string) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const splitLines = (value?: string) =>
  value
    ?.split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean) ?? [];

function LabeledMeaningRow({
  testID,
  meaning,
  isDark,
}: LabeledMeaningRowProps) {
  const displayMeaning = toDisplayValue(meaning);

  if (!displayMeaning) {
    return null;
  }

  return (
    <View testID={testID} style={styles.meaningRow}>
      <InlineMeaningWithChips
        meaning={displayMeaning}
        isDark={isDark}
        textStyle={[
          styles.cardDescription,
          { color: isDark ? "#e0e0e0" : "#2c2c2c" },
        ]}
        containerStyle={styles.inlineMeaning}
        chipStyle={styles.inlineChip}
        testID={`${testID}-content`}
      />
    </View>
  );
}

function ExampleBlock({
  example,
  exampleRoman,
  translation,
  isDark,
  showKana,
}: ExampleBlockProps) {
  const { speak } = useSpeech();
  const processedExample = React.useMemo(
    () => (showKana || !example ? example : stripKanaParens(example)),
    [example, showKana],
  );
  const examples = React.useMemo(() => splitLines(processedExample), [processedExample]);
  const exampleRomans = React.useMemo(
    () => splitLines(exampleRoman),
    [exampleRoman],
  );
  const translations = React.useMemo(() => splitLines(translation), [translation]);

  const rowCount = Math.max(
    examples.length,
    exampleRomans.length,
    translations.length,
  );
  const rowIndices = React.useMemo(
    () => Array.from({ length: rowCount }, (_, index) => index),
    [rowCount],
  );

  const handleSpeak = React.useCallback(
    async (text: string) => {
      try {
        await speak(text, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.9,
        });
      } catch (error) {
        console.error("TTS error:", error);
      }
    },
    [speak],
  );

  if (rowCount === 0) {
    return null;
  }

  return (
    <View style={styles.exampleSection}>
      {rowIndices.map((index) => {
        const exampleText = examples[index];
        const exampleRomanText = exampleRomans[index];
        const translationText = translations[index];

        return (
          <View key={index} style={styles.exampleGroup}>
            {exampleText ? (
              <>
                <TouchableOpacity
                  onPress={() => handleSpeak(exampleText)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cardExample,
                      { color: isDark ? "#b0b0b0" : "#444" },
                      { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
                    ]}
                    numberOfLines={2}
                  >
                    {exampleText}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            {exampleRomanText ? (
              <Text
                testID={index === 0 ? "jlpt-card-example-roman" : undefined}
                style={[
                  styles.cardExampleRoman,
                  { color: isDark ? "#8d97a6" : "#6f7785" },
                  { borderLeftColor: isDark ? "#5f6b7a" : "#aab3c2" },
                ]}
                numberOfLines={2}
              >
                {exampleRomanText}
              </Text>
            ) : null}

            {translationText ? (
              <Text
                testID={index === 0 ? "jlpt-card-translation" : undefined}
                style={[
                  styles.cardTranslation,
                  { color: isDark ? "#a8e6a1" : "#2d5f2d" },
                  { borderLeftColor: isDark ? "#34c759" : "#28a745" },
                ]}
                numberOfLines={2}
              >
                {translationText}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function JlptVocabularyCard({
  item,
  initialIsSaved = false,
  day,
  onSavedWordChange,
  showKana = false,
  onToggleKana = () => {},
}: JlptVocabularyCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const { speak: speakText } = useSpeech();
  const resolved = React.useMemo(
    () => resolveVocabularyContent(item, i18n.language),
    [i18n.language, item],
  );
  const pronunciation = toDisplayValue(resolved.sharedPronunciation);
  const pronunciationRoman = toDisplayValue(resolved.pronunciationRoman);
  const combinedPronunciation = React.useMemo(() => {
    if (pronunciation && pronunciationRoman) {
      return `${pronunciation} [${pronunciationRoman}]`;
    }
    if (pronunciation) {
      return pronunciation;
    }
    if (pronunciationRoman) {
      return `[${pronunciationRoman}]`;
    }
    return undefined;
  }, [pronunciation, pronunciationRoman]);

  const handlePressWord = React.useCallback(() => {
    void speakText(item.word, WORD_TTS_OPTIONS);
  }, [item.word, speakText]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
      ]}
    >
      <SwipeCardItemImageSection
        testID="jlpt-card-image-shell"
        imageUrl={item.imageUrl}
        isDark={isDark}
      />

      <View
        testID="jlpt-card-info"
        style={[
          styles.cardInfo,
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        <ScrollView
          testID="jlpt-card-info-scroll"
          style={styles.cardInfoScroll}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.cardInfoContent}
        >
          <View style={styles.titleContainer}>
            <View style={styles.leftRow}>
              <TouchableOpacity onPress={handlePressWord} activeOpacity={0.7}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDark ? "#fff" : "#1a1a1a" },
                  ]}
                  numberOfLines={1}
                >
                  {item.word}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addButtonContainer}>
              <SwipeCardItemAddToWordBankButton
                item={item}
                isDark={isDark}
                initialIsSaved={initialIsSaved}
                day={day}
                onSavedWordChange={onSavedWordChange}
              />
            </View>
          </View>

          {combinedPronunciation ? (
            <Text
              testID="jlpt-card-pronunciation"
              style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
            >
              {combinedPronunciation}
            </Text>
          ) : null}

          <View style={styles.meaningSection}>
            <LabeledMeaningRow
              testID="jlpt-card-meaning"
              meaning={resolved.meaning}
              isDark={isDark}
            />
          </View>

          <ExampleBlock
            example={resolved.example}
            exampleRoman={resolved.exampleRoman}
            translation={resolved.translation}
            isDark={isDark}
            showKana={showKana}
          />
        </ScrollView>

        <View testID="jlpt-card-kana-toggle-bar" style={styles.kanaToggleBar}>
          <Text
            style={[
              styles.kanaToggleText,
              { color: isDark ? "#8e8e93" : "#666" },
            ]}
          >
            がな
          </Text>
          <Switch
            testID="jlpt-card-kana-toggle-switch"
            value={showKana}
            onValueChange={onToggleKana}
            trackColor={{ false: isDark ? "#3a3a3c" : "#d1d1d6", true: "#007AFF" }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  cardInfo: {
    height: "65%",
    backgroundColor: "#fff",
    flexDirection: "column",
  },
  cardInfoScroll: {
    flex: 1,
  },
  cardInfoContent: {
    padding: 24,
    paddingBottom: 32,
  },
  kanaToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.28)",
    backgroundColor: "rgba(127,127,127,0.05)",
  },
  kanaToggleText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexShrink: 1,
    minWidth: 0,
  },
  addButtonContainer: {
    marginLeft: "auto",
    paddingLeft: 12,
    alignSelf: "flex-start",
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 2,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  meaningSection: {
    marginTop: 4,
    marginBottom: 8,
    gap: 10,
  },
  meaningRow: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inlineMeaning: {
    gap: 4,
  },
  inlineChip: {
    marginRight: 6,
  },
  cardDescription: {
    fontSize: 17,
    color: "#2c2c2c",
    lineHeight: 24,
    fontWeight: "500",
  },
  exampleSection: {
    marginTop: 4,
  },
  exampleGroup: {
    marginTop: 8,
  },
  cardExample: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    lineHeight: 20,
  },
  cardExampleRoman: {
    fontSize: 14,
    fontStyle: "italic",
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginTop: 4,
    lineHeight: 20,
  },
  cardTranslation: {
    fontSize: 16,
    fontWeight: "500",
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginTop: 4,
    lineHeight: 22,
  },
});

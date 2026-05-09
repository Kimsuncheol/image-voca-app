import React from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { getFontColors } from "../../../constants/fontColors";
import { useStudySpeech } from "../../../src/hooks/useStudyMode";
import type { ReviewMaskTarget } from "../../../src/services/speechPreferences";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../../src/utils/japaneseText";
import {
  getReviewTapeTextStyle,
  parseReviewMaskSegments,
  shouldMaskReviewContent,
  stripReviewMaskDelimiters,
} from "../../../src/utils/reviewMasking";
import { styles } from "./KanjiCollocationCardStyles";
import { trimmedStringAt } from "./kanjiCollocationUtils";

/**
 * Props for the general examples section on the back of the card.
 * Handles flat array strings rather than structured nested list groups.
 */
interface GeneralBackSectionProps {
  /** Array of general example sentences to present */
  examples: string[];
  /** Array of hurigana reading mappings for the examples */
  hurigana: string[];
  /** Array of translations for the examples */
  translations: string[];
  /** Whether dark mode is enabled */
  isDark: boolean;
  /** Whether the card is currently active/visible on the screen */
  isActive: boolean;
  /** State determining if the inline furigana parenthesis text should be visibly rendered */
  showFurigana: boolean;
  /** Whether example target spans should be hidden under tape masks */
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
  /** Callback triggered to flip the card horizontally back to the front face */
  onFlip: () => void;
}

/**
 * GeneralBackSection
 * 
 * Renders the general "EXAMPLE" section located at the bottom of the card's back face.
 * This component parses generic example sentences and applies styling logic to format
 * embedded Kana (furigana parenthesis) correctly so they can be toggled interactively.
 */
export function GeneralBackSection({
  examples,
  hurigana,
  translations,
  isDark,
  isActive,
  showFurigana,
  isReviewMode = false,
  reviewMaskTarget = "word",
  onFlip,
}: GeneralBackSectionProps) {
  const { handleSpeech } = useStudySpeech();
  const fontColors = getFontColors(isDark);
  const maskWholeExample = shouldMaskReviewContent(
    isReviewMode,
    reviewMaskTarget,
    "example",
  );
  const maskDelimitedWord = shouldMaskReviewContent(
    isReviewMode,
    reviewMaskTarget,
    "word",
  );
  const items = examples
    .map((example, index) => ({
      example: example.trim(),
      translation: trimmedStringAt(translations, index),
      originalIndex: index,
    }))
    .filter((item) => item.example);

  const handleSpeak = React.useCallback(
    (event: GestureResponderEvent | undefined, text: string, index: number) => {
      event?.stopPropagation();
      if (!isActive) return;
      const tts =
        trimmedStringAt(hurigana, index) ??
        stripKanaParens(stripReviewMaskDelimiters(text));
      void handleSpeech(tts, "JP");
    },
    [handleSpeech, isActive, hurigana],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.backSection}>
      <Pressable
        testID="kanji-collocation-example-title-row"
        onPress={onFlip}
        style={styles.backFlippableRow}
      >
        <Text
          suppressHighlighting
          style={[
            styles.backSectionTitle,
            { color: fontColors.learningCardMuted },
          ]}
        >
          EXAMPLE
        </Text>
      </Pressable>
      <Pressable
        testID="kanji-collocation-example-row"
        onPress={onFlip}
        style={styles.backFlippableRow}
      >
        <View style={styles.backPairsContainer}>
          {items.map((item) => {
            const visibleExample = showFurigana
              ? item.example
              : stripKanaParens(item.example);
            const visibleSegments = parseReviewMaskSegments(visibleExample);

            return (
              <TouchableOpacity
                key={`general-ex-${item.originalIndex}`}
                onPress={(event) =>
                  handleSpeak(event, item.example, item.originalIndex)
                }
                activeOpacity={0.7}
                testID={`kanji-collocation-example-item-${item.originalIndex}`}
                style={styles.backGeneralExampleItem}
              >
                <View
                  testID={`kanji-collocation-example-frame-${item.originalIndex}`}
                  style={styles.backExampleFrame}
                >
                  <Text
                    testID={`kanji-collocation-example-sizer-${item.originalIndex}`}
                    style={[
                      styles.backExample,
                      styles.backExampleSizer,
                    ]}
                  >
                    {visibleSegments.flatMap((reviewSegment, segmentIndex) =>
                      splitJapaneseTextSegments(reviewSegment.text).map(
                        (segment, japaneseSegmentIndex) => (
                          <Text
                            key={`sizer-${item.originalIndex}-${segmentIndex}-${japaneseSegmentIndex}`}
                            style={
                              segment.isKanaParen
                                ? [
                                    styles.backInlineFurigana,
                                    styles.backExampleSizer,
                                  ]
                                : undefined
                            }
                          >
                            {segment.text}
                          </Text>
                        ),
                      ),
                    )}
                  </Text>
                  <Text
                    testID={`kanji-collocation-example-visible-${item.originalIndex}`}
                    style={[
                      styles.backExample,
                      styles.backExampleOverlay,
                      maskWholeExample
                        ? getReviewTapeTextStyle(isDark)
                        : { color: fontColors.learningCardPrimary },
                    ]}
                  >
                    {visibleSegments.flatMap((reviewSegment, segmentIndex) =>
                      splitJapaneseTextSegments(reviewSegment.text).map(
                        (segment, japaneseSegmentIndex) => (
                          <Text
                            key={`visible-${item.originalIndex}-${segmentIndex}-${japaneseSegmentIndex}`}
                            testID={
                              segment.isKanaParen
                                ? segmentIndex === 0
                                  ? `kanji-collocation-example-furigana-segment-${item.originalIndex}-${japaneseSegmentIndex}`
                                  : `kanji-collocation-example-furigana-segment-${item.originalIndex}-${segmentIndex}-${japaneseSegmentIndex}`
                                : undefined
                            }
                            style={[
                              segment.isKanaParen
                                ? [
                                    styles.backInlineFurigana,
                                    { color: fontColors.learningCardMuted },
                                  ]
                                : undefined,
                              maskWholeExample ||
                              (maskDelimitedWord && reviewSegment.masked)
                                ? getReviewTapeTextStyle(isDark)
                                : undefined,
                            ]}
                          >
                            {segment.text}
                          </Text>
                        ),
                      ),
                    )}
                  </Text>
                </View>
                {item.translation ? (
                  <Text
                    style={[
                      styles.backTranslation,
                      maskWholeExample
                        ? getReviewTapeTextStyle(isDark)
                        : { color: fontColors.learningCardMuted },
                    ]}
                  >
                    {item.translation}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </View>
  );
}

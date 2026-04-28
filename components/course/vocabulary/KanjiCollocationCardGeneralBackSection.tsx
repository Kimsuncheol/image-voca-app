import React from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { useSpeech } from "../../../src/hooks/useSpeech";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../../src/utils/japaneseText";
import { styles } from "./KanjiCollocationCardStyles";
import { blackCardColors } from "./blackCardStyles";
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
  onFlip,
}: GeneralBackSectionProps) {
  const { speak } = useSpeech();
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
      const tts = trimmedStringAt(hurigana, index) ?? stripKanaParens(text);
      void speak(tts, { language: "ja-JP" });
    },
    [isActive, speak, hurigana],
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
            { color: blackCardColors.muted },
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
            const visibleSegments = splitJapaneseTextSegments(visibleExample);

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
                    {visibleSegments.map((segment, segmentIndex) => (
                      <Text
                        key={`sizer-${item.originalIndex}-${segmentIndex}`}
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
                    ))}
                  </Text>
                  <Text
                    testID={`kanji-collocation-example-visible-${item.originalIndex}`}
                    style={[
                      styles.backExample,
                      styles.backExampleOverlay,
                      { color: blackCardColors.primary },
                    ]}
                  >
                    {visibleSegments.map((segment, segmentIndex) => (
                      <Text
                        key={`visible-${item.originalIndex}-${segmentIndex}`}
                        testID={
                          segment.isKanaParen
                            ? `kanji-collocation-example-furigana-segment-${item.originalIndex}-${segmentIndex}`
                            : undefined
                        }
                        style={
                          segment.isKanaParen
                            ? [
                                styles.backInlineFurigana,
                                { color: blackCardColors.muted },
                              ]
                            : undefined
                        }
                      >
                        {segment.text}
                      </Text>
                    ))}
                  </Text>
                </View>
                {item.translation ? (
                  <Text
                    style={[
                      styles.backTranslation,
                      { color: blackCardColors.muted },
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

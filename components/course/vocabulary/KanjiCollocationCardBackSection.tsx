import React from "react";
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { getFontColors } from "../../../constants/fontColors";
import { useSpeech } from "../../../src/hooks/useSpeech";
import type { KanjiNestedListGroup } from "../../../src/types/vocabulary";
import { styles } from "./KanjiCollocationCardStyles";
import { itemsAt } from "./kanjiCollocationUtils";

/**
 * Props for the specific vocabulary section on the back of the card (e.g. Meaning, Reading).
 * Contains structured nested list data for advanced rendering of collocations and definitions.
 */
interface BackSectionProps {
  /** The display title of the section */
  title: string;
  /** Primary values for the section (e.g. list of meanings) */
  values: string[];
  /** Grouped examples corresponding to each value */
  examples: KanjiNestedListGroup[];
  /** Grouped hurigana corresponding to the examples */
  hurigana: KanjiNestedListGroup[];
  /** Grouped translations corresponding to the examples */
  translations: KanjiNestedListGroup[];
  /** Whether dark mode is enabled */
  isDark: boolean;
  /** Whether the card is currently active/visible on the screen */
  isActive: boolean;
  /** State determining if the furigana text should be visibly rendered */
  showFurigana: boolean;
  /** Callback triggered to flip the card horizontally back to the front face */
  onFlip: () => void;
}

/**
 * BackSection
 * 
 * Renders a specific data grouping on the back of the Kanji Collocation Card.
 * Maps over the provided values (meanings/readings), displaying the main values
 * along with their respective example sentences, furigana overlays, and translations.
 */
export function BackSection({
  title,
  values,
  examples,
  hurigana,
  translations,
  isDark,
  isActive,
  onFlip,
}: BackSectionProps) {
  const { speak } = useSpeech();
  const fontColors = getFontColors(isDark);

  const entries = values
    .map((value, index) => ({
      value: value.trim(),
      examples: itemsAt(examples, index),
      hurigana: itemsAt(hurigana, index),
      translations: itemsAt(translations, index),
    }))
    .filter((e) => e.value);

  const handleSpeak = React.useCallback(
    (event: GestureResponderEvent | undefined, text: string) => {
      event?.stopPropagation();
      if (!isActive) return;
      void speak(text, { language: "ja-JP" });
    },
    [isActive, speak],
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.backSection}>
      <Pressable
        testID={`kanji-collocation-${title.toLowerCase()}-title-row`}
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
          {title}
        </Text>
      </Pressable>
      {entries.map((entry, i) => (
        <View key={`${title}-${i}`} style={styles.backGroup}>
          <Pressable
            testID={`kanji-collocation-${title.toLowerCase()}-value-row-${i}`}
            onPress={onFlip}
            style={styles.backFlippableRow}
          >
            <Text
              suppressHighlighting
              style={[
                styles.backGroupLabel,
                { color: fontColors.learningCardPrimary },
              ]}
            >
              {entry.value}
            </Text>
          </Pressable>
          <Pressable
            testID={`kanji-collocation-${title.toLowerCase()}-examples-row-${i}`}
            onPress={onFlip}
            style={styles.backFlippableRow}
          >
            <View
              testID={`kanji-collocation-${title.toLowerCase()}-pairs-container-${i}`}
              style={styles.backPairsContainer}
            >
              {entry.examples.map((example, j) => {
                const huriganaText = entry.hurigana[j] ?? "あ";
                const hasHurigana = Boolean(entry.hurigana[j]);

                return (
                  <TouchableOpacity
                    key={`${title}-${i}-ex-${j}`}
                    onPress={(event) =>
                      handleSpeak(event, entry.hurigana[j] ?? example)
                    }
                    activeOpacity={0.7}
                    testID={`kanji-collocation-${title.toLowerCase()}-pair-item-${i}-${j}`}
                    style={styles.backPairItem}
                  >
                    <View
                      testID={`kanji-collocation-${title.toLowerCase()}-main-row-${i}-${j}`}
                      style={styles.backPairMainRow}
                    >
                      <Text
                        style={[
                          styles.backExample,
                          { color: fontColors.learningCardPrimary },
                        ]}
                      >
                        {example}
                      </Text>
                      {entry.translations[j] ? (
                        <Text
                          style={[
                            styles.backTranslation,
                            { color: fontColors.learningCardMuted },
                          ]}
                        >
                          {entry.translations[j]}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      testID={`kanji-collocation-${title.toLowerCase()}-hurigana-${i}-${j}`}
                      style={[
                        styles.backFurigana,
                        hasHurigana
                          ? { color: fontColors.learningCardMuted }
                          : styles.backFuriganaSpacer,
                      ]}
                    >
                      {huriganaText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
  showFurigana,
}: BackSectionProps) {
  const { speak } = useSpeech();

  const entries = values
    .map((value, index) => ({
      value: value.trim(),
      examples: itemsAt(examples, index),
      hurigana: itemsAt(hurigana, index),
      translations: itemsAt(translations, index),
    }))
    .filter((e) => e.value);

  const handleSpeak = React.useCallback(
    (text: string) => {
      if (!isActive) return;
      void speak(text, { language: "ja-JP" });
    },
    [isActive, speak],
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.backSection}>
      <Text
        style={[styles.backSectionTitle, { color: isDark ? "#999" : "#666" }]}
      >
        {title}
      </Text>
      {entries.map((entry, i) => (
        <View key={`${title}-${i}`} style={styles.backGroup}>
          <Text
            style={[
              styles.backGroupLabel,
              { color: isDark ? "#fff" : "#1a1a1a" },
            ]}
          >
            {entry.value}
          </Text>
          <View style={styles.backPairsContainer}>
            {entry.examples.map((example, j) => {
              const huriganaText = entry.hurigana[j] ?? "あ";
              const hasHurigana = Boolean(entry.hurigana[j]);
              const showVisibleHurigana = showFurigana && hasHurigana;

              return (
                <TouchableOpacity
                  key={`${title}-${i}-ex-${j}`}
                  onPress={() => handleSpeak(entry.hurigana[j] ?? example)}
                  activeOpacity={0.7}
                  style={styles.backPairItem}
                >
                  <View
                    testID={`kanji-collocation-${title.toLowerCase()}-main-row-${i}-${j}`}
                    style={styles.backPairMainRow}
                  >
                    <Text
                      style={[
                        styles.backExample,
                        { color: isDark ? "#aaa" : "#555" },
                      ]}
                    >
                      {example}
                    </Text>
                    {entry.translations[j] ? (
                      <Text
                        style={[
                          styles.backTranslation,
                          { color: isDark ? "#777" : "#888" },
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
                      showVisibleHurigana
                        ? { color: isDark ? "#888" : "#999" }
                        : styles.backFuriganaSpacer,
                    ]}
                  >
                    {huriganaText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

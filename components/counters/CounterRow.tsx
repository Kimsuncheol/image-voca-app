import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CounterWord } from "../../src/types/counters";
import { useTheme } from "../../src/context/ThemeContext";
import { useSpeech } from "../../src/hooks/useSpeech";
import { splitJapaneseTextSegments, stripKanaParens } from "../../src/utils/japaneseText";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { buildGroupedLines } from "../prefix-postfix/utils";
import { ThemedText } from "../themed-text";

interface Props {
  item: CounterWord;
  index: number;
  showFurigana: boolean;
}

export function CounterRow({ item, index, showFurigana }: Props) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const isKorean = i18n.language === "ko";
  const { speak } = useSpeech();

  const primaryText = isDark ? "#fff" : "#2a3437";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";
  const rowBg =
    index % 2 === 0
      ? isDark
        ? "#000"
        : "#fff"
      : isDark
        ? "#111"
        : "#f0f4f6";

  const word = item.word;
  const meaning = isKorean ? item.meaningKorean : item.meaningEnglish;
  const translation = isKorean ? item.translationKorean : item.translationEnglish;
  const pronunciationGroups = buildGroupedLines(item.pronunciation);
  const exampleGroups = buildGroupedLines(item.example, translation);

  const handleSpeakWord = useCallback(async () => {
    try {
      await speakWordVariants(word, speak, {
        language: "ja-JP",
        rate: 0.85,
      });
    } catch (error) {
      console.error("Counter word TTS error:", error);
    }
  }, [speak, word]);

  const renderExampleText = useCallback(
    (text: string) => {
      if (!showFurigana) return stripKanaParens(text);
      return splitJapaneseTextSegments(text).map((seg, i) =>
        seg.isKanaParen ? (
          <Text key={i} style={styles.furiganaText}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      );
    },
    [showFurigana],
  );

  const handleSpeakExample = useCallback(
    async (text: string) => {
      try {
        await speak(stripKanaParens(text), {
          language: "ja-JP",
          rate: 0.85,
        });
      } catch (error) {
        console.error("Counter example TTS error:", error);
      }
    },
    [speak],
  );

  return (
    <View style={[styles.row, { backgroundColor: rowBg }]}>
      <View style={[styles.cell, styles.counterColumn]}>
        <TouchableOpacity onPress={() => void handleSpeakWord()} activeOpacity={0.7}>
          <ThemedText style={[styles.wordText, { color: primaryText }]}>
            {word}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, styles.meaningColumn]}>
        <ThemedText style={[styles.bodyText, { color: primaryText }]}>
          {meaning}
        </ThemedText>
      </View>

      <View style={[styles.cell, styles.pronunColumn]}>
        {pronunciationGroups ? (
          pronunciationGroups.map((group, groupIndex) => (
            <View
              key={`${item.id}-pron-${group[0]}`}
              style={groupIndex > 0 ? styles.groupBlock : undefined}
            >
              <ThemedText
                style={[
                  styles.bodyText,
                  styles.leftAlignedText,
                  { color: primaryText },
                ]}
              >
                {group[0]}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText
            style={[
              styles.bodyText,
              styles.leftAlignedText,
              { color: primaryText },
            ]}
          >
            {item.pronunciation}
          </ThemedText>
        )}
      </View>

      <View style={[styles.cell, styles.exampleColumn]}>
        {exampleGroups ? (
          exampleGroups.map((group, groupIndex) => (
            <View
              key={`${item.id}-example-${group[0]}`}
              style={groupIndex > 0 ? styles.groupBlock : undefined}
            >
              <TouchableOpacity
                onPress={() => void handleSpeakExample(group[0])}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.exampleText,
                    styles.leftAlignedText,
                    { color: primaryText },
                  ]}
                >
                  {renderExampleText(group[0])}
                </ThemedText>
              </TouchableOpacity>
              <ThemedText
                style={[
                  styles.subText,
                  styles.leftAlignedText,
                  { color: mutedText },
                ]}
              >
                {group[1]}
              </ThemedText>
            </View>
          ))
        ) : (
          <>
            <TouchableOpacity
              onPress={() => void handleSpeakExample(item.example)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.exampleText,
                  styles.leftAlignedText,
                  { color: primaryText },
                ]}
              >
                {renderExampleText(item.example)}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText
              style={[
                styles.subText,
                styles.leftAlignedText,
                { color: mutedText },
              ]}
            >
              {translation}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cell: {
    paddingRight: 4,
  },
  counterColumn: {
    flex: 0.85,
  },
  meaningColumn: {
    flex: 0.85,
  },
  pronunColumn: {
    flex: 1.15,
    paddingLeft: 6,
    paddingRight: 4,
  },
  exampleColumn: {
    flex: 1.15,
    paddingLeft: 6,
    paddingRight: 0,
  },
  groupBlock: {
    marginTop: 8,
    width: "100%",
  },
  wordText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bodyText: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  furiganaText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8e8e93",
  },
  subText: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },
  leftAlignedText: {
    textAlign: "left",
    width: "100%",
  },
});

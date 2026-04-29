import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";

import { useTheme } from "../../src/context/ThemeContext";
import { useSpeech } from "../../src/hooks/useSpeech";
import type { PostfixWord, PrefixWord } from "../../src/types/prefixPostfix";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { ElementaryTableRow } from "../elementary-japanese/ElementaryTable";
import { ThemedText } from "../themed-text";
import type { Tab } from "./PrefixPostfixTabs";
import { buildGroupedLines } from "./utils";
import { LineHeights } from "@/constants/lineHeights";

interface Props {
  item: PrefixWord | PostfixWord;
  tab: Tab;
  index: number;
}

export function PrefixPostfixRow({ item, tab, index }: Props) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const isKorean = i18n.language === "ko";
  const { speak } = useSpeech();

  const primaryText = isDark ? "#fff" : "#2a3437";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";

  const word =
    tab === "prefix"
      ? (item as PrefixWord).prefix
      : (item as PostfixWord).postfix;
  const meaning = isKorean ? item.meaningKorean : item.meaningEnglish;
  const translation = isKorean ? item.translationKorean : item.translationEnglish;
  const pronunciationGroups = buildGroupedLines(item.pronunciation);
  const exampleGroups = item.exampleFurigana
    ? buildGroupedLines(item.example, item.exampleFurigana, translation)
    : buildGroupedLines(item.example, translation);

  const handleSpeak = useCallback(async () => {
    try {
      await speakWordVariants(word, speak, { language: "ja-JP" });
    } catch (error) {
      console.error("Prefix/Postfix TTS error:", error);
    }
  }, [speak, word]);

  return (
    <ElementaryTableRow index={index}>
      {/* Prefix / Postfix */}
      <View style={[styles.cell, styles.wordColumn]}>
        <TouchableOpacity onPress={handleSpeak} activeOpacity={0.7}>
          <ThemedText style={[styles.wordText, { color: primaryText }]}>
            {word}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Meaning */}
      <View style={[styles.cell, styles.meaningColumn]}>
        <ThemedText style={[styles.bodyText, { color: primaryText }]}>
          {meaning}
        </ThemedText>
      </View>

      {/* Pronunciation */}
      <View style={[styles.cell, styles.pronunColumn]}>
        {pronunciationGroups ? (
          pronunciationGroups.map((group, groupIndex) => (
            <View
              key={`${item.id}-pron-${group.index}`}
              style={groupIndex > 0 ? styles.groupBlock : undefined}
            >
              <ThemedText
                style={[styles.bodyText, styles.leftAlignedText, { color: primaryText }]}
              >
                {group.values[0]}
              </ThemedText>
            </View>
          ))
        ) : (
          <ThemedText
            style={[styles.bodyText, styles.leftAlignedText, { color: primaryText }]}
          >
            {item.pronunciation}
          </ThemedText>
        )}
      </View>

      {/* Example */}
      <View style={[styles.cell, styles.exampleColumn]}>
        {exampleGroups ? (
          exampleGroups.map((group, groupIndex) => {
            const hasFurigana = group.values.length === 3;
            return (
              <View
                key={`${item.id}-example-${group.index}`}
                style={[styles.exampleGroupRow, groupIndex > 0 ? styles.groupBlock : undefined]}
              >
                <ThemedText style={[styles.indexText, { color: primaryText }]}>
                  {group.index}.
                </ThemedText>
                <View style={styles.exampleContent}>
                  <ThemedText
                    style={[styles.exampleText, styles.leftAlignedText, { color: primaryText }]}
                  >
                    {group.values[0]}
                  </ThemedText>
                  {hasFurigana && (
                    <ThemedText
                      style={[styles.furiganaText, styles.leftAlignedText, { color: mutedText }]}
                    >
                      {group.values[1]}
                    </ThemedText>
                  )}
                  <ThemedText
                    style={[styles.subText, styles.leftAlignedText, { color: mutedText }]}
                  >
                    {hasFurigana ? group.values[2] : group.values[1]}
                  </ThemedText>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.exampleGroupRow}>
            <View style={styles.exampleContent}>
              <ThemedText
                style={[styles.exampleText, styles.leftAlignedText, { color: primaryText }]}
              >
                {item.example}
              </ThemedText>
              {item.exampleFurigana && (
                <ThemedText
                  style={[styles.furiganaText, styles.leftAlignedText, { color: mutedText }]}
                >
                  {item.exampleFurigana}
                </ThemedText>
              )}
              <ThemedText style={[styles.subText, styles.leftAlignedText, { color: mutedText }]}>
                {translation}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </ElementaryTableRow>
  );
}

const styles = StyleSheet.create({
  cell: {
    paddingRight: 4,
  },
  wordColumn: {
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
  exampleGroupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  indexText: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.bodyMd,
    marginRight: 3,
    minWidth: 13,
  },
  exampleContent: {
    flex: 1,
  },
  wordText: {
    fontSize: FontSizes.body,
    fontWeight: "700",
  },
  bodyText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    lineHeight: LineHeights.bodyMd,
  },
  exampleText: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    lineHeight: LineHeights.bodyMd,
  },
  furiganaText: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.body,
    marginTop: 1,
  },
  subText: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.body,
    marginTop: 1,
  },
  leftAlignedText: {
    textAlign: "left",
    width: "100%",
  },
});

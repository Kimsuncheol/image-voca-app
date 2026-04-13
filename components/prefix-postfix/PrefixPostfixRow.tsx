import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../src/context/ThemeContext";
import { useSpeech } from "../../src/hooks/useSpeech";
import type { PostfixWord, PrefixWord } from "../../src/types/prefixPostfix";
import { speakWordVariants } from "../../src/utils/wordVariants";
import { ElementaryTableRow } from "../elementary-japanese/ElementaryTable";
import { ThemedText } from "../themed-text";
import type { Tab } from "./PrefixPostfixTabs";
import { buildGroupedLines } from "./utils";

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
  const translation = `${item.translationEnglish}(${item.translationKorean})`;
  const pronunciationGroups = buildGroupedLines(item.pronunciation);
  const exampleGroups = buildGroupedLines(item.example, item.translationEnglish);

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

      {/* Example */}
      <View style={[styles.cell, styles.exampleColumn]}>
        {exampleGroups ? (
          exampleGroups.map((group, groupIndex) => (
            <View
              key={`${item.id}-example-${group[0]}`}
              style={groupIndex > 0 ? styles.groupBlock : undefined}
            >
              <ThemedText
                style={[
                  styles.exampleText,
                  styles.leftAlignedText,
                  { color: primaryText },
                ]}
              >
                {group[0]}
              </ThemedText>
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
            <ThemedText
              style={[
                styles.exampleText,
                styles.leftAlignedText,
                { color: primaryText },
              ]}
            >
              {item.example}
            </ThemedText>
            <ThemedText style={[styles.subText, styles.leftAlignedText, { color: mutedText }]}>
              {translation}
            </ThemedText>
          </>
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
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
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

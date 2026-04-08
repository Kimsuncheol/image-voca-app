import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import type { CounterTabId, CounterWord } from "../../src/types/counters";
import { buildGroupedLines } from "../prefix-postfix/utils";
import { ThemedText } from "../themed-text";

interface Props {
  item: CounterWord;
  index: number;
  tab: CounterTabId;
}

export function CounterRow({ item, index, tab }: Props) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const isKorean = i18n.language === "ko";
  const router = useRouter();

  const primaryText = isDark ? "#fff" : "#2a3437";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";
  const iconColor = isDark ? "#8e8e93" : "#6e6e73";
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
  const translation = `${item.translationEnglish}(${item.translationKorean})`;
  const pronunciationGroups = buildGroupedLines(item.pronunciation);
  const exampleGroups = buildGroupedLines(item.example, item.translationEnglish);

  const handleOpenDetail = useCallback(() => {
    router.push({
      pathname: "/counter-detail",
      params: {
        id: item.id,
        tab,
      },
    });
  }, [item.id, router, tab]);

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: rowBg }]}
      onPress={handleOpenDetail}
      activeOpacity={0.72}
    >
      <View style={[styles.cell, styles.counterColumn]}>
        <ThemedText style={[styles.wordText, { color: primaryText }]}>
          {word}
        </ThemedText>
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

      <View style={styles.chevronColumn}>
        <Ionicons name="chevron-forward" size={16} color={iconColor} />
      </View>
    </TouchableOpacity>
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
  chevronColumn: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 8,
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

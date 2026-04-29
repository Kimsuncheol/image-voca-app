import { FontWeights } from "@/constants/fontWeights";
import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontSizes } from "@/constants/fontSizes";

import {
  ElementaryTable,
  ElementaryTableRow,
} from "../components/elementary-japanese/ElementaryTable";
import { ThemedText } from "../components/themed-text";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { GREETINGS_DATA } from "../src/data/greetings";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeech } from "../src/hooks/useSpeech";
import type { GreetingWord } from "../src/types/greetings";
import { speakWordVariants } from "../src/utils/wordVariants";
import { LineHeights } from "@/constants/lineHeights";

type GreetingRowProps = {
  item: GreetingWord;
  index: number;
  isDark: boolean;
  isKorean: boolean;
  onSpeak: (word: string) => void;
};

function GreetingRow({
  item,
  index,
  isDark,
  isKorean,
  onSpeak,
}: GreetingRowProps) {
  const fontColors = getFontColors(isDark);
  const primaryText = fontColors.tablePrimary;
  const mutedText = fontColors.screenMuted;

  return (
    <ElementaryTableRow index={index}>
      <View style={[styles.cell, styles.wordColumn]}>
        <TouchableOpacity onPress={() => onSpeak(item.word)} activeOpacity={0.7}>
          <ThemedText style={[styles.wordText, { color: primaryText }]}>
            {item.word}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, styles.meaningColumn]}>
        <ThemedText style={[styles.bodyText, { color: primaryText }]}>
          {isKorean ? item.meaningKorean : item.meaningEnglish}
        </ThemedText>
      </View>

      <View style={[styles.cell, styles.pronunciationColumn]}>
        <ThemedText style={[styles.bodyText, { color: mutedText }]}>
          {item.pronunciation}
        </ThemedText>
      </View>
    </ElementaryTableRow>
  );
}

export default function JapaneseGreetingsScreen() {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { speak } = useSpeech();
  const fontColors = getFontColors(isDark);

  const bgColors = getBackgroundColors(isDark);
  const bg = bgColors.screenAlt;
  const heroCardBg = bgColors.heroCardPanel;
  const accentBg = bgColors.greetingsAccentBg;
  const accentText = fontColors.greetingsAccentText;
  const subtitleColor = fontColors.heroSubtitle;
  const sectionLabelColor = fontColors.sectionLabelSoft;
  const isKorean = i18n.language === "ko";

  const handleSpeak = useCallback(
    async (word: string) => {
      try {
        await speakWordVariants(word, speak, { language: "ja-JP" });
      } catch (error) {
        console.error("Greeting TTS error:", error);
      }
    },
    [speak],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: t("greetings.title", { defaultValue: "Greetings" }),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: heroCardBg }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.accentPill, { backgroundColor: accentBg }]}>
              <ThemedText style={[styles.accentPillText, { color: accentText }]}>
                {t("elementaryJapanese.title", {
                  defaultValue: "Elementary Japanese",
                })}
              </ThemedText>
            </View>
            <View style={styles.heroDots}>
              <View
                style={[
                  styles.heroDotLarge,
                  { backgroundColor: bgColors.greetingsStatCard1 },
                ]}
              />
              <View
                style={[
                  styles.heroDotSmall,
                  { backgroundColor: bgColors.greetingsStatCard2 },
                ]}
              />
            </View>
          </View>

          <View style={styles.heroTextGroup}>
            <ThemedText type="title">
              {t("greetings.title", { defaultValue: "Greetings" })}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              {t("greetings.subtitle", {
                defaultValue:
                  "Study essential everyday Japanese greetings and tap any phrase to hear it spoken.",
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {t("greetings.title", { defaultValue: "Greetings" })}
          </ThemedText>
        </View>

        <ElementaryTable
          columns={[
            {
              key: "word",
              label: t("greetings.colWord", { defaultValue: "WORD" }),
              style: styles.wordColumn,
            },
            {
              key: "meaning",
              label: t("greetings.colMeaning", { defaultValue: "MEANING" }),
              style: styles.meaningColumn,
            },
            {
              key: "pronunciation",
              label: t("greetings.colPronunciation", {
                defaultValue: "PRONUNCIATION",
              }),
              style: styles.pronunciationColumn,
            },
          ]}
          hasData={GREETINGS_DATA.length > 0}
          style={styles.tableWrapper}
        >
          {GREETINGS_DATA.map((item, index) => (
            <GreetingRow
              key={item.id}
              item={item}
              index={index}
              isDark={isDark}
              isKorean={isKorean}
              onSpeak={(word) => void handleSpeak(word)}
            />
          ))}
        </ElementaryTable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 28,
    gap: 18,
    padding: 20,
  },
  heroTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accentPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  accentPillText: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
  },
  heroDots: {
    alignItems: "flex-end",
    gap: 8,
    minWidth: 44,
  },
  heroDotLarge: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  heroDotSmall: {
    borderRadius: 999,
    height: 8,
    width: 28,
  },
  heroTextGroup: {
    gap: 10,
  },
  subtitle: {
    fontSize: FontSizes.bodyMd,
    lineHeight: LineHeights.titleLg,
    maxWidth: "92%",
  },
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tableWrapper: {
    marginTop: 0,
  },
  cell: {
    paddingRight: 4,
  },
  wordColumn: {
    flex: 0.85,
  },
  pronunciationColumn: {
    flex: 1.15,
    paddingLeft: 6,
    paddingRight: 0,
  },
  meaningColumn: {
    flex: 0.95,
  },
  wordText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
  },
  bodyText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: LineHeights.bodyMd,
  },
});

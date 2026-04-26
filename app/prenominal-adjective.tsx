import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ElementaryTable,
  ElementaryTableRow,
} from "../components/elementary-japanese/ElementaryTable";
import { ThemedText } from "../components/themed-text";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeech } from "../src/hooks/useSpeech";
import { PRENOMINAL_ADJECTIVE_DATA } from "../src/data/prenominalAdjective";
import type { PrenominalAdjectiveWord } from "../src/types/prenominalAdjective";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../src/utils/japaneseText";
import { speakWordVariants } from "../src/utils/wordVariants";

type RowProps = {
  item: PrenominalAdjectiveWord;
  index: number;
  isDark: boolean;
  isKorean: boolean;
  showFurigana: boolean;
  onSpeakWord: (word: string) => void;
  onSpeakExample: (text: string) => void;
};

function PrenominalAdjectiveRow({
  item,
  index,
  isDark,
  isKorean,
  showFurigana,
  onSpeakWord,
  onSpeakExample,
}: RowProps) {
  const fontColors = getFontColors(isDark);
  const primaryText = fontColors.tablePrimary;
  const mutedText = fontColors.screenMuted;

  const meaning = isKorean ? item.meaningKorean : item.meaningEnglish;
  const translation = isKorean ? item.translationKorean : item.translationEnglish;

  const renderExampleText = useCallback(
    (text: string) => {
      if (!showFurigana) return stripKanaParens(text);
      return splitJapaneseTextSegments(text).map((seg, i) =>
        seg.isKanaParen ? (
          <Text key={i} style={[styles.furiganaText, { color: mutedText }]}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      );
    },
    [showFurigana, mutedText],
  );

  return (
    <ElementaryTableRow index={index}>
      <View style={[styles.cell, styles.wordColumn]}>
        <TouchableOpacity
          onPress={() => onSpeakWord(item.word)}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.wordText, { color: primaryText }]}>
            {item.word}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, styles.meaningColumn]}>
        <ThemedText style={[styles.bodyText, { color: primaryText }]}>
          {meaning}
        </ThemedText>
      </View>

      <View style={[styles.cell, styles.exampleColumn]}>
        <TouchableOpacity
          onPress={() => onSpeakExample(item.example)}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[styles.exampleText, styles.leftAligned, { color: primaryText }]}
          >
            {renderExampleText(item.example)}
          </ThemedText>
        </TouchableOpacity>
        <ThemedText
          style={[styles.subText, styles.leftAligned, { color: mutedText }]}
        >
          {translation}
        </ThemedText>
      </View>
    </ElementaryTableRow>
  );
}

export default function PrenominalAdjectiveScreen() {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { speak } = useSpeech();
  const [showFurigana, setShowFurigana] = useState(false);
  const fontColors = getFontColors(isDark);

  const bgColors = getBackgroundColors(isDark);
  const bg = bgColors.screenAlt;
  const heroCardBg = bgColors.heroCardPanel;
  const accentBg = bgColors.prenominalAccentBg;
  const accentText = fontColors.prenominalAccentText;
  const subtitleColor = fontColors.heroSubtitle;
  const sectionLabelColor = fontColors.sectionLabelSoft;
  const isKorean = i18n.language === "ko";

  const handleSpeakWord = useCallback(
    async (word: string) => {
      try {
        await speakWordVariants(word, speak, { language: "ja-JP" });
      } catch (error) {
        console.error("Prenominal adjective word TTS error:", error);
      }
    },
    [speak],
  );

  const handleSpeakExample = useCallback(
    async (text: string) => {
      try {
        await speak(stripKanaParens(text), { language: "ja-JP" });
      } catch (error) {
        console.error("Prenominal adjective example TTS error:", error);
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
          title: t("prenominalAdjective.title", {
            defaultValue: "Prenominal Adjectives",
          }),
          headerBackTitle: t("common.back"),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowFurigana((prev) => !prev)}
              style={{ marginRight: 4 }}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.furiganaToggle,
                  { color: fontColors.actionAccent },
                ]}
              >
                {showFurigana
                  ? t("counters.hideFurigana", { defaultValue: "Hide Furigana" })
                  : t("counters.showFurigana", { defaultValue: "Show Furigana" })}
              </ThemedText>
            </TouchableOpacity>
          ),
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
                  { backgroundColor: bgColors.accentPurple },
                ]}
              />
              <View
                style={[
                  styles.heroDotSmall,
                  { backgroundColor: bgColors.accentPurpleSoft },
                ]}
              />
            </View>
          </View>

          <View style={styles.heroTextGroup}>
            <ThemedText type="title">
              {t("prenominalAdjective.title", {
                defaultValue: "Prenominal Adjectives",
              })}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              {t("prenominalAdjective.subtitle", {
                defaultValue:
                  "Words that appear before nouns — demonstratives, particles, and connectors. Tap any word or example to hear it spoken.",
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionLabel, { color: sectionLabelColor }]}>
            {t("prenominalAdjective.title", {
              defaultValue: "Prenominal Adjectives",
            })}
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
              key: "example",
              label: t("counters.colExample", { defaultValue: "EXAMPLE" }),
              style: styles.exampleColumn,
            },
          ]}
          hasData={PRENOMINAL_ADJECTIVE_DATA.length > 0}
          style={styles.tableWrapper}
        >
          {PRENOMINAL_ADJECTIVE_DATA.map((item, index) => (
            <PrenominalAdjectiveRow
              key={item.id}
              item={item}
              index={index}
              isDark={isDark}
              isKorean={isKorean}
              showFurigana={showFurigana}
              onSpeakWord={(word) => void handleSpeakWord(word)}
              onSpeakExample={(text) => void handleSpeakExample(text)}
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
    fontWeight: "700",
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
    lineHeight: 22,
    maxWidth: "92%",
  },
  sectionHeader: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontWeight: "700",
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
    flex: 0.75,
  },
  meaningColumn: {
    flex: 0.9,
  },
  exampleColumn: {
    flex: 1.35,
    paddingLeft: 6,
    paddingRight: 0,
  },
  wordText: {
    fontSize: FontSizes.body,
    fontWeight: "700",
  },
  bodyText: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    lineHeight: 16,
  },
  exampleText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    lineHeight: 17,
  },
  furiganaText: {
    fontSize: FontSizes.xxs,
    fontWeight: "500",
  },
  subText: {
    fontSize: FontSizes.xs,
    lineHeight: 15,
    marginTop: 2,
  },
  leftAligned: {
    textAlign: "left",
    width: "100%",
  },
  furiganaToggle: {
    fontSize: FontSizes.bodyMd,
    fontWeight: "600",
  },
});

import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import {
  KanaSection,
  KanaSectionId,
  HIRAGANA_SECTIONS,
  KATAKANA_SECTIONS,
  CharCell,
} from "../src/data/kana";
import { useSpeech } from "../src/hooks/useSpeech";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = 16;
const COL_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COL_GAP * 4) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.15;

// ─────────────────────────────────────────────────────────────────────────────
// CharCard
// ─────────────────────────────────────────────────────────────────────────────

interface CharCardProps {
  item: CharCell;
  isDark: boolean;
  isActive: boolean;
  onPress: (kana: string) => void;
}

const CharCard = React.memo(function CharCard({
  item,
  isDark,
  isActive,
  onPress,
}: CharCardProps) {
  const fontColors = getFontColors(isDark);
  const bgColors = getBackgroundColors(isDark);

  if (!item) {
    return <View style={styles.cardSlot} />;
  }

  const cardBg = isActive ? bgColors.accent : bgColors.cardSubtle;

  const kanaColor = isActive
    ? fontColors.buttonOnAccent
    : fontColors.screenTitleStrong;
  const romajiColor = isActive
    ? fontColors.kanaRomajiActive
    : fontColors.kanaRomaji;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={() => onPress(item.kana)}
      activeOpacity={0.65}
    >
      <ThemedText style={[styles.kana, { color: kanaColor }]}>
        {item.kana}
      </ThemedText>
      <ThemedText style={[styles.romaji, { color: romajiColor }]}>
        {item.romaji}
      </ThemedText>
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "hiragana" | "katakana";

export default function JapaneseCharactersScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const speech = useSpeech();
  const fontColors = getFontColors(isDark);

  const [tab, setTab] = useState<Tab>("hiragana");
  const [speakingKana, setSpeakingKana] = useState<string | null>(null);

  const sections = tab === "hiragana" ? HIRAGANA_SECTIONS : KATAKANA_SECTIONS;

  const handlePress = useCallback(
    async (kana: string) => {
      setSpeakingKana(kana);
      await speech.speak(kana, {
        language: "ja-JP",
        onDone: () => setSpeakingKana(null),
        onError: () => {
          setSpeakingKana(null);
        },
      });
    },
    [speech],
  );

  const bgColors = getBackgroundColors(isDark);
  const bg = bgColors.screen;
  const tabInactiveBorder = isDark ? "#333" : "#e5e5e5";
  const tabInactiveBg = bgColors.cardSubtle;
  const sectionDivider = bgColors.sectionDividerLine;
  const sectionSubtitleColor = fontColors.sectionSubtitle;
  const sectionAccent = bgColors.sectionAccentLine;

  const renderSectionHeader = useCallback(
    (sectionId: KanaSectionId) => {
      const title = t(`kana.sections.${sectionId}.title`);
      const subtitle = t(`kana.sections.${sectionId}.subtitle`);

      return (
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionDivider,
              { backgroundColor: sectionDivider },
            ]}
          />
          <View style={styles.sectionHeadingRow}>
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: sectionAccent },
              ]}
            />
          </View>
          <ThemedText
            style={[styles.sectionSubtitle, { color: sectionSubtitleColor }]}
          >
            {subtitle}
          </ThemedText>
        </View>
      );
    },
    [sectionAccent, sectionDivider, sectionSubtitleColor, t],
  );

  const renderSection = useCallback(
    (section: KanaSection) => (
      <View key={`${tab}-${section.id}`} style={styles.section}>
        {renderSectionHeader(section.id)}
        <View style={styles.sectionRows}>
          {section.rows.map((row, rowIndex) => (
            <View key={`${tab}-${section.id}-row-${rowIndex}`} style={styles.row}>
              {row.map((cell, cellIndex) => (
                <CharCard
                  key={`${tab}-${section.id}-${rowIndex}-${cellIndex}`}
                  item={cell}
                  isDark={isDark}
                  isActive={cell !== null && speakingKana === cell.kana}
                  onPress={handlePress}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    ),
    [handlePress, isDark, renderSectionHeader, speakingKana, tab],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("kana.title"),
          headerBackTitle: t("common.back"),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/kana-quiz",
                  params: { type: tab },
                })
              }
              style={{ marginRight: 4 }}
              activeOpacity={0.7}
            >
              <ThemedText
                style={{
                  fontSize: FontSizes.bodyMd,
                  color: fontColors.actionAccent,
                  fontWeight: "600",
                }}
              >
                {t("kana.quiz.title", { defaultValue: "Quiz" })}
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Tab chips */}
      <View style={styles.tabBar}>
        {(["hiragana", "katakana"] as Tab[]).map((id) => {
          const isSelected = tab === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.tabChip,
                isSelected
                  ? { backgroundColor: bgColors.tabActiveBg }
                  : { backgroundColor: tabInactiveBg, borderWidth: 1, borderColor: tabInactiveBorder },
              ]}
              onPress={() => setTab(id)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected
                      ? fontColors.selectedOnLight
                      : fontColors.screenTitleStrong,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {t(`kana.${id}`)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        key={tab}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(renderSection)}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: FontSizes.body,
  },
  grid: {
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 8,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: FontSizes.subhead,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: FontSizes.label,
  },
  sectionAccent: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  sectionRows: {
    gap: COL_GAP,
  },
  row: {
    flexDirection: "row",
    gap: COL_GAP,
  },
  cardSlot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  kana: {
    fontSize: FontSizes.headingMd,
    fontWeight: "500",
  },
  romaji: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
});

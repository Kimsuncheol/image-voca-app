import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeech } from "../src/hooks/useSpeech";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = 16;
const COL_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - COL_GAP * 4) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.15;

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

type Char = { kana: string; romaji: string };
type CharCell = Char | null;
type GridItem = { key: string; cell: CharCell };

const HIRAGANA: CharCell[][] = [
  [{ kana: "あ", romaji: "a" }, { kana: "い", romaji: "i" }, { kana: "う", romaji: "u" }, { kana: "え", romaji: "e" }, { kana: "お", romaji: "o" }],
  [{ kana: "か", romaji: "ka" }, { kana: "き", romaji: "ki" }, { kana: "く", romaji: "ku" }, { kana: "け", romaji: "ke" }, { kana: "こ", romaji: "ko" }],
  [{ kana: "さ", romaji: "sa" }, { kana: "し", romaji: "shi" }, { kana: "す", romaji: "su" }, { kana: "せ", romaji: "se" }, { kana: "そ", romaji: "so" }],
  [{ kana: "た", romaji: "ta" }, { kana: "ち", romaji: "chi" }, { kana: "つ", romaji: "tsu" }, { kana: "て", romaji: "te" }, { kana: "と", romaji: "to" }],
  [{ kana: "な", romaji: "na" }, { kana: "に", romaji: "ni" }, { kana: "ぬ", romaji: "nu" }, { kana: "ね", romaji: "ne" }, { kana: "の", romaji: "no" }],
  [{ kana: "は", romaji: "ha" }, { kana: "ひ", romaji: "hi" }, { kana: "ふ", romaji: "fu" }, { kana: "へ", romaji: "he" }, { kana: "ほ", romaji: "ho" }],
  [{ kana: "ま", romaji: "ma" }, { kana: "み", romaji: "mi" }, { kana: "む", romaji: "mu" }, { kana: "め", romaji: "me" }, { kana: "も", romaji: "mo" }],
  [{ kana: "や", romaji: "ya" }, null, { kana: "ゆ", romaji: "yu" }, null, { kana: "よ", romaji: "yo" }],
  [{ kana: "ら", romaji: "ra" }, { kana: "り", romaji: "ri" }, { kana: "る", romaji: "ru" }, { kana: "れ", romaji: "re" }, { kana: "ろ", romaji: "ro" }],
  [{ kana: "わ", romaji: "wa" }, null, null, null, { kana: "を", romaji: "wo" }],
  [{ kana: "ん", romaji: "n" }, null, null, null, null],
];

const KATAKANA: CharCell[][] = [
  [{ kana: "ア", romaji: "a" }, { kana: "イ", romaji: "i" }, { kana: "ウ", romaji: "u" }, { kana: "エ", romaji: "e" }, { kana: "オ", romaji: "o" }],
  [{ kana: "カ", romaji: "ka" }, { kana: "キ", romaji: "ki" }, { kana: "ク", romaji: "ku" }, { kana: "ケ", romaji: "ke" }, { kana: "コ", romaji: "ko" }],
  [{ kana: "サ", romaji: "sa" }, { kana: "シ", romaji: "shi" }, { kana: "ス", romaji: "su" }, { kana: "セ", romaji: "se" }, { kana: "ソ", romaji: "so" }],
  [{ kana: "タ", romaji: "ta" }, { kana: "チ", romaji: "chi" }, { kana: "ツ", romaji: "tsu" }, { kana: "テ", romaji: "te" }, { kana: "ト", romaji: "to" }],
  [{ kana: "ナ", romaji: "na" }, { kana: "ニ", romaji: "ni" }, { kana: "ヌ", romaji: "nu" }, { kana: "ネ", romaji: "ne" }, { kana: "ノ", romaji: "no" }],
  [{ kana: "ハ", romaji: "ha" }, { kana: "ヒ", romaji: "hi" }, { kana: "フ", romaji: "fu" }, { kana: "ヘ", romaji: "he" }, { kana: "ホ", romaji: "ho" }],
  [{ kana: "マ", romaji: "ma" }, { kana: "ミ", romaji: "mi" }, { kana: "ム", romaji: "mu" }, { kana: "メ", romaji: "me" }, { kana: "モ", romaji: "mo" }],
  [{ kana: "ヤ", romaji: "ya" }, null, { kana: "ユ", romaji: "yu" }, null, { kana: "ヨ", romaji: "yo" }],
  [{ kana: "ラ", romaji: "ra" }, { kana: "リ", romaji: "ri" }, { kana: "ル", romaji: "ru" }, { kana: "レ", romaji: "re" }, { kana: "ロ", romaji: "ro" }],
  [{ kana: "ワ", romaji: "wa" }, null, null, null, { kana: "ヲ", romaji: "wo" }],
  [{ kana: "ン", romaji: "n" }, null, null, null, null],
];

function buildGridData(rows: CharCell[][]): GridItem[] {
  return rows.flatMap((row, ri) =>
    row.map((cell, ci) => ({ key: `${ri}-${ci}`, cell })),
  );
}

const HIRAGANA_DATA = buildGridData(HIRAGANA);
const KATAKANA_DATA = buildGridData(KATAKANA);

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
  if (!item) {
    return <View style={styles.cardSlot} />;
  }

  const cardBg = isActive
    ? "#007AFF"
    : isDark
      ? "#1c1c1e"
      : "#f5f5f5";

  const kanaColor = isActive ? "#fff" : isDark ? "#fff" : "#111827";
  const romajiColor = isActive
    ? "rgba(255,255,255,0.75)"
    : isDark
      ? "rgba(255,255,255,0.4)"
      : "rgba(0,0,0,0.38)";

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
  const speech = useSpeech();

  const [tab, setTab] = useState<Tab>("hiragana");
  const [speakingKana, setSpeakingKana] = useState<string | null>(null);

  const data = tab === "hiragana" ? HIRAGANA_DATA : KATAKANA_DATA;

  const handlePress = useCallback(
    async (kana: string) => {
      setSpeakingKana(kana);
      await speech.speak(kana, {
        language: "ja-JP",
        rate: 0.75,
        onDone: () => setSpeakingKana(null),
        onError: () => setSpeakingKana(null),
      });
    },
    [speech],
  );

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => (
      <CharCard
        item={item.cell}
        isDark={isDark}
        isActive={item.cell !== null && speakingKana === item.cell.kana}
        onPress={handlePress}
      />
    ),
    [isDark, speakingKana, handlePress],
  );

  const bg = isDark ? "#000" : "#fff";
  const tabInactiveBorder = isDark ? "#333" : "#e5e5e5";
  const tabInactiveBg = isDark ? "#1c1c1e" : "#f5f5f5";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("kana.title"),
          headerBackTitle: t("common.back"),
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
                  ? { backgroundColor: isDark ? "#fff" : "#111827" }
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
                      ? isDark ? "#111827" : "#fff"
                      : isDark ? "#fff" : "#111827",
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

      {/* Grid */}
      <FlatList
        key={tab}
        data={data}
        keyExtractor={(item) => item.key}
        numColumns={5}
        renderItem={renderItem}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: 14,
  },
  tabChip: {
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 14,
  },
  grid: {
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
    gap: COL_GAP,
  },
  row: {
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
    fontSize: 26,
    fontWeight: "500",
  },
  romaji: {
    fontSize: 11,
    fontWeight: "500",
  },
});

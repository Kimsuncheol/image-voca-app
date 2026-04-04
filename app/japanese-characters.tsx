import { Stack, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
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
  const router = useRouter();
  const speech = useSpeech();

  const [tab, setTab] = useState<Tab>("hiragana");
  const [speakingKana, setSpeakingKana] = useState<string | null>(null);

  const sections = tab === "hiragana" ? HIRAGANA_SECTIONS : KATAKANA_SECTIONS;

  const handlePress = useCallback(
    async (kana: string) => {
      setSpeakingKana(kana);
      await speech.speak(kana, {
        language: "ja-JP",
        rate: 0.75,
        onDone: () => setSpeakingKana(null),
        onError: () => {
          setSpeakingKana(null);
        },
      });
    },
    [speech],
  );

  const bg = isDark ? "#000" : "#fff";
  const tabInactiveBorder = isDark ? "#333" : "#e5e5e5";
  const tabInactiveBg = isDark ? "#1c1c1e" : "#f5f5f5";
  const sectionDivider = isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.1)";
  const sectionSubtitleColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(17,24,39,0.55)";
  const sectionAccent = isDark ? "#8ab4ff" : "#2563eb";

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
              <ThemedText style={{ fontSize: 15, color: "#007AFF", fontWeight: "600" }}>
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
    fontSize: 17,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
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
    fontSize: 26,
    fontWeight: "500",
  },
  romaji: {
    fontSize: 11,
    fontWeight: "500",
  },
});

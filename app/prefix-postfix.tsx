import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { useTheme } from "../src/context/ThemeContext";
import { POSTFIXES, PREFIXES } from "../src/data/prefixPostfix";
import type { PostfixWord, PrefixWord } from "../src/types/prefixPostfix";

type Tab = "prefix" | "postfix";

export default function PrefixPostfixScreen() {
  const [tab, setTab] = useState<Tab>("prefix");
  const [search, setSearch] = useState("");
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();

  const isKorean = i18n.language === "ko";

  const data: (PrefixWord | PostfixWord)[] = tab === "prefix" ? PREFIXES : POSTFIXES;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const word =
        tab === "prefix"
          ? (item as PrefixWord).prefix
          : (item as PostfixWord).postfix;
      return (
        word.toLowerCase().includes(q) ||
        item.meaningEnglish.toLowerCase().includes(q) ||
        item.meaningKorean.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q)
      );
    });
  }, [data, search, tab]);

  const colHeader = tab === "prefix"
    ? t("prefixPostfix.colPrefix")
    : t("prefixPostfix.colPostfix");

  const bg = isDark ? "#000" : "#f2f2f7";
  const primaryText = isDark ? "#fff" : "#2a3437";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";
  const headerRowBg = isDark ? "#1c1c1e" : "#e8eff1";
  const searchBg = isDark ? "#1c1c1e" : "#f5f5f5";
  const tabActiveBg = isDark ? "#fff" : "#111827";
  const tabActiveText = isDark ? "#111827" : "#fff";
  const tabInactiveBg = isDark ? "#1c1c1e" : "#f5f5f5";
  const tabInactiveBorder = isDark ? "#333" : "#e5e5e5";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("prefixPostfix.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: searchBg, color: primaryText }]}
          placeholder={t("prefixPostfix.searchPlaceholder")}
          placeholderTextColor={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(["prefix", "postfix"] as Tab[]).map((id) => {
          const isSelected = tab === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.tabChip,
                isSelected
                  ? { backgroundColor: tabActiveBg }
                  : {
                      backgroundColor: tabInactiveBg,
                      borderWidth: 1,
                      borderColor: tabInactiveBorder,
                    },
              ]}
              onPress={() => {
                setTab(id);
                setSearch("");
              }}
              activeOpacity={0.75}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  {
                    color: isSelected ? tabActiveText : mutedText,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {id === "prefix"
                  ? t("prefixPostfix.tabPrefix")
                  : t("prefixPostfix.tabPostfix")}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Table */}
      <View style={styles.tableWrapper}>
        {/* Header row */}
        <View style={[styles.row, { backgroundColor: headerRowBg }]}>
          <ThemedText style={[styles.headerCell, { color: mutedText }]}>
            {colHeader}
          </ThemedText>
          <ThemedText style={[styles.headerCell, { color: mutedText }]}>
            {t("prefixPostfix.colMeaning")}
          </ThemedText>
          <ThemedText style={[styles.headerCell, styles.cellRight, { color: mutedText }]}>
            {t("prefixPostfix.colPronun")}
          </ThemedText>
          <ThemedText style={[styles.headerCell, styles.cellRight, { color: mutedText }]}>
            {t("prefixPostfix.colExample")}
          </ThemedText>
        </View>

        {/* Data rows */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtered.map((item, index) => {
            const word =
              tab === "prefix"
                ? (item as PrefixWord).prefix
                : (item as PostfixWord).postfix;
            const meaning = isKorean ? item.meaningKorean : item.meaningEnglish;
            const translation = isKorean
              ? item.translationKorean
              : item.translationEnglish;
            const rowBg =
              index % 2 === 0
                ? isDark ? "#000" : "#fff"
                : isDark ? "#111" : "#f0f4f6";

            return (
              <View key={item.id} style={[styles.row, { backgroundColor: rowBg }]}>
                {/* Prefix / Postfix */}
                <View style={styles.cell}>
                  <ThemedText style={[styles.wordText, { color: primaryText }]}>
                    {word}
                  </ThemedText>
                </View>

                {/* Meaning */}
                <View style={styles.cell}>
                  <ThemedText style={[styles.bodyText, { color: primaryText }]}>
                    {meaning}
                  </ThemedText>
                </View>

                {/* Pronunciation */}
                <View style={[styles.cell, styles.cellRight]}>
                  <ThemedText style={[styles.bodyText, { color: primaryText }]}>
                    {item.pronunciation}
                  </ThemedText>
                  <ThemedText style={[styles.subText, { color: mutedText }]}>
                    {item.pronunciationRoman}
                  </ThemedText>
                </View>

                {/* Example */}
                <View style={[styles.cell, styles.cellRight]}>
                  <ThemedText style={[styles.exampleText, { color: primaryText }]}>
                    {item.example}
                  </ThemedText>
                  <ThemedText style={[styles.subText, { color: mutedText }]}>
                    {item.exampleRoman}
                  </ThemedText>
                  <ThemedText style={[styles.subText, { color: mutedText }]}>
                    {translation}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabLabel: {
    fontSize: 14,
  },
  tableWrapper: {
    flex: 1,
    marginHorizontal: 0,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cell: {
    flex: 1,
    paddingRight: 4,
  },
  cellRight: {
    alignItems: "flex-end",
    paddingRight: 0,
    paddingLeft: 4,
  },
  headerCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  wordText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bodyText: {
    fontSize: 11,
    fontWeight: "500",
  },
  exampleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  subText: {
    fontSize: 10,
    marginTop: 1,
  },
});

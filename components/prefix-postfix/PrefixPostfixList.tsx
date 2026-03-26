import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { useTheme } from '../../src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { PrefixWord, PostfixWord } from '../../src/types/prefixPostfix';
import type { Tab } from './PrefixPostfixTabs';
import { PrefixPostfixRow } from './PrefixPostfixRow';

interface Props {
  tab: Tab;
  search: string;
  data: (PrefixWord | PostfixWord)[];
  loading: boolean;
  error: string | null;
}

export function PrefixPostfixList({ tab, search, data, loading, error }: Props) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const hasData = data.length > 0;
  
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

  const headerRowBg = isDark ? "#1c1c1e" : "#e8eff1";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";

  const colHeader = tab === "prefix"
    ? t("prefixPostfix.colPrefix")
    : t("prefixPostfix.colPostfix");

  return (
    <View style={styles.tableWrapper}>
      {/* Header row */}
      <View style={[styles.row, { backgroundColor: headerRowBg }]}>
        <ThemedText style={[styles.headerCell, styles.wordColumn, { color: mutedText }]}>
          {colHeader}
        </ThemedText>
        <ThemedText style={[styles.headerCell, styles.meaningColumn, { color: mutedText }]}>
          {t("prefixPostfix.colMeaning")}
        </ThemedText>
        <ThemedText style={[styles.headerCell, styles.pronunColumn, { color: mutedText }]}>
          {t("prefixPostfix.colPronun")}
        </ThemedText>
        <ThemedText style={[styles.headerCell, styles.exampleColumn, { color: mutedText }]}>
          {t("prefixPostfix.colExample")}
        </ThemedText>
      </View>

      {/* Data rows */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ThemedText style={[styles.bodyText, { color: mutedText }]}>
              {t("prefixPostfix.loading", { defaultValue: "Loading..." })}
            </ThemedText>
          </View>
        ) : null}
        {!loading && error ? (
          <View style={styles.loadingRow}>
            <ThemedText style={[styles.bodyText, { color: mutedText }]}>
              {error}
            </ThemedText>
          </View>
        ) : null}
        {!loading && !error && !hasData ? (
          <View style={styles.loadingRow}>
            <ThemedText style={[styles.bodyText, { color: mutedText }]}>
              {t("prefixPostfix.empty", {
                defaultValue: "No prefix/postfix data found.",
              })}
            </ThemedText>
          </View>
        ) : null}
        
        {filtered.map((item, index) => (
          <PrefixPostfixRow 
            key={item.id} 
            item={item} 
            tab={tab} 
            index={index} 
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    flex: 1,
    marginHorizontal: 0,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  loadingRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  bodyText: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 16,
  },
});

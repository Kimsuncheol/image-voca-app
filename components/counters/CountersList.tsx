import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { CounterWord } from "../../src/types/counters";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { CounterRow } from "./CounterRow";

interface Props {
  data: CounterWord[];
  loading: boolean;
  error: string | null;
  showFurigana: boolean;
}

export function CountersList({ data, loading, error, showFurigana }: Props) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const headerRowBg = isDark ? "#1c1c1e" : "#e8eff1";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>
            {t("counters.loading", { defaultValue: "Loading..." })}
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

      {!loading && !error && data.length === 0 ? (
        <View style={styles.loadingRow}>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>
            {t("counters.empty", {
              defaultValue: "No counters found.",
            })}
          </ThemedText>
        </View>
      ) : null}

      {!loading && !error && data.length > 0 ? (
        <View style={styles.section}>
          <View style={[styles.row, { backgroundColor: headerRowBg }]}>
            <ThemedText
              style={[styles.headerCell, styles.counterColumn, { color: mutedText }]}
            >
              {t("counters.colCounter")}
            </ThemedText>
            <ThemedText
              style={[styles.headerCell, styles.meaningColumn, { color: mutedText }]}
            >
              {t("counters.colMeaning")}
            </ThemedText>
            <ThemedText
              style={[styles.headerCell, styles.pronunColumn, { color: mutedText }]}
            >
              {t("counters.colPronun")}
            </ThemedText>
            <ThemedText
              style={[styles.headerCell, styles.exampleColumn, { color: mutedText }]}
            >
              {t("counters.colExample")}
            </ThemedText>
          </View>
          {data.map((item, index) => (
            <CounterRow key={item.id} item={item} index={index} showFurigana={showFurigana} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 12,
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

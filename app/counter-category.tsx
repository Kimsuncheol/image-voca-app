import { ThemedText } from "@/components/themed-text";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountersList } from "../components/counters/CountersList";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { getCountersData } from "../src/services/countersService";
import type { CounterTabId, CounterWord } from "../src/types/counters";
import { COUNTER_TAB_IDS } from "../src/types/counters";
import { FontSizes } from "@/constants/fontSizes";

const isCounterTabId = (value: string): value is CounterTabId =>
  COUNTER_TAB_IDS.includes(value as CounterTabId);

export default function CounterCategoryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const fontColors = getFontColors(isDark);

  const [data, setData] = useState<CounterWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFurigana, setShowFurigana] = useState(false);

  const activeTab = useMemo<CounterTabId | null>(
    () => (tab && isCounterTabId(tab) ? tab : null),
    [tab],
  );

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!activeTab) {
        setError(
          t("counters.detailNotFound", {
            defaultValue: "Counter details are unavailable.",
          }),
        );
        setLoading(false);
        return;
      }

      try {
        const result = await getCountersData(activeTab);
        if (!isActive) return;
        setError(null);
        setData(result);
      } catch (loadError) {
        if (!isActive) return;
        console.warn(`Failed to load counters data for ${activeTab}:`, loadError);
        setData([]);
        setError(
          t("counters.loadError", {
            defaultValue: "Unable to load counters data.",
          }),
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [activeTab, t]);

  const bgColors = getBackgroundColors(isDark);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screenAlt }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title:
            activeTab != null
              ? t(`counters.tabs.${activeTab}`)
              : t("counters.title"),
          headerBackTitle: t("common.back"),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowFurigana((prev) => !prev)}
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
                {showFurigana
                  ? t("counters.hideFurigana", { defaultValue: "Hide Furigana" })
                  : t("counters.showFurigana", { defaultValue: "Show Furigana" })}
              </ThemedText>
            </TouchableOpacity>
          ),
        }}
      />

      <CountersList
        data={data}
        loading={loading}
        error={error}
        showFurigana={showFurigana}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

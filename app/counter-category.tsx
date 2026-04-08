import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountersList } from "../components/counters/CountersList";
import { useTheme } from "../src/context/ThemeContext";
import { getCountersData } from "../src/services/countersService";
import { COUNTER_TAB_IDS } from "../src/types/counters";
import type { CounterTabId, CounterWord } from "../src/types/counters";

const isCounterTabId = (value: string): value is CounterTabId =>
  COUNTER_TAB_IDS.includes(value as CounterTabId);

export default function CounterCategoryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [data, setData] = useState<CounterWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const bg = isDark ? "#000" : "#f2f2f7";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title:
            activeTab != null
              ? t(`counters.tabs.${activeTab}`)
              : t("counters.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <CountersList
        data={data}
        loading={loading}
        error={error}
        tab={activeTab ?? COUNTER_TAB_IDS[0]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

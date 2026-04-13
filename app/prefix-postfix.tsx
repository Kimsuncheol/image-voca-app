import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import { getPrefixPostfixData } from "../src/services/prefixPostfixService";
import type { PostfixWord, PrefixWord } from "../src/types/prefixPostfix";

import { PrefixPostfixTabs } from "../components/prefix-postfix/PrefixPostfixTabs";
import { PrefixPostfixList } from "../components/prefix-postfix/PrefixPostfixList";
import type { Tab } from "../components/prefix-postfix/PrefixPostfixTabs";

export default function PrefixPostfixScreen() {
  const [tab, setTab] = useState<Tab>("prefix");
  const [prefixes, setPrefixes] = useState<PrefixWord[]>([]);
  const [postfixes, setPostfixes] = useState<PostfixWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const result = await getPrefixPostfixData();

        if (!isActive) return;

        setError(null);
        setPrefixes(result.prefixes);
        setPostfixes(result.postfixes);
      } catch (error) {
        if (!isActive) return;

        console.warn("Failed to load prefix/postfix data:", error);
        setPrefixes([]);
        setPostfixes([]);
        setError(
          t("prefixPostfix.loadError", {
            defaultValue: "Unable to load prefix/postfix data.",
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
  }, []);

  const data: (PrefixWord | PostfixWord)[] =
    tab === "prefix" ? prefixes : postfixes;

  const bg = isDark ? "#000" : "#f2f2f7";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: t("prefixPostfix.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <PrefixPostfixTabs tab={tab} setTab={setTab} />

      <PrefixPostfixList 
        tab={tab} 
        data={data} 
        loading={loading} 
        error={error} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

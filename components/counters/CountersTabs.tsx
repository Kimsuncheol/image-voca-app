import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import type { CounterTabId } from "../../src/types/counters";
import { COUNTER_TAB_IDS } from "../../src/types/counters";
import { ThemedText } from "../themed-text";

interface Props {
  onSelect: (tab: CounterTabId) => void;
}

const COUNTER_TAB_ICONS: Record<CounterTabId, keyof typeof Ionicons.glyphMap> = {
  numbers: "calculator-outline",
  counter_tsuu: "mail-open-outline",
  counter_ko: "cube-outline",
  counter_kai_floor: "business-outline",
  counter_kai_times: "refresh-outline",
  counter_ban: "bookmark-outline",
  counter_years: "calendar-outline",
  counter_months: "moon-outline",
  counter_days: "sunny-outline",
  counter_hours: "time-outline",
  counter_minutes: "timer-outline",
  counter_weekdays: "today-outline",
  counter_hai: "wine-outline",
  counter_bai: "git-compare-outline",
  counter_hon: "pause-outline",
  counter_mai: "copy-outline",
  counter_nin: "people-outline",
  counter_hiki: "paw-outline",
};

export function CountersTabs({ onSelect }: Props) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const tileBg = isDark ? "#17181c" : "#ffffff";
  const tileBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(17,24,39,0.08)";
  const tileText = isDark ? "#fff" : "#111827";
  const iconShellBg = isDark ? "#24262b" : "#f3f4f6";
  const iconColor = isDark ? "#9cc0ff" : "#2563eb";

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {COUNTER_TAB_IDS.map((id) => {
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.tabTile,
                {
                  backgroundColor: tileBg,
                  borderWidth: 1,
                  borderColor: tileBorder,
                },
              ]}
              onPress={() => onSelect(id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconShell,
                  { backgroundColor: iconShellBg },
                ]}
              >
                <Ionicons
                  name={COUNTER_TAB_ICONS[id]}
                  size={20}
                  color={iconColor}
                />
              </View>
              <ThemedText
                style={[
                  styles.tabLabel,
                  {
                    color: tileText,
                    fontWeight: "600",
                  },
                ]}
              >
                {t(`counters.tabs.${id}`)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    rowGap: 12,
  },
  tabTile: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 24,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: "31.5%",
  },
  iconShell: {
    alignItems: "center",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    width: "100%",
  },
});

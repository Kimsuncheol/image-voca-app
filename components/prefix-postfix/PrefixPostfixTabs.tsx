import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { useTheme } from '../../src/context/ThemeContext';
import { FontSizes } from "@/constants/fontSizes";

export type Tab = "prefix" | "postfix";

interface Props {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

export function PrefixPostfixTabs({ tab, setTab }: Props) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const tabActiveBg = isDark ? "#fff" : "#111827";
  const tabActiveText = isDark ? "#111827" : "#fff";
  const tabInactiveBg = isDark ? "#1c1c1e" : "#f5f5f5";
  const tabInactiveBorder = isDark ? "#333" : "#e5e5e5";
  const mutedText = isDark ? "#8e8e93" : "#6e6e73";

  return (
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
  );
}

const styles = StyleSheet.create({
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
    fontSize: FontSizes.body,
  },
});

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';

interface Props {
  search: string;
  setSearch: (text: string) => void;
}

export function PrefixPostfixSearch({ search, setSearch }: Props) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  const searchBg = isDark ? "#1c1c1e" : "#f5f5f5";
  const primaryText = isDark ? "#fff" : "#2a3437";

  return (
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
  );
}

const styles = StyleSheet.create({
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
});

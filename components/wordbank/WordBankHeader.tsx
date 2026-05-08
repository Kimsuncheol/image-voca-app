import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface WordBankHeaderProps {
  rightAction?: React.ReactNode;
}

export function WordBankHeader({ rightAction }: WordBankHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <ThemedText type="title">{t("wordBank.title")}</ThemedText>
        <ThemedText style={styles.subtitle}>{t("wordBank.subtitle")}</ThemedText>
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  rightAction: {
    flexShrink: 0,
    paddingTop: 2,
  },
  subtitle: {
    fontSize: FontSizes.bodyLg,
    opacity: 0.6,
    marginTop: 4,
  },
});

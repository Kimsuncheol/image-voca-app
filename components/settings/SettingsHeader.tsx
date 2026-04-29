import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

interface SettingsHeaderProps {
  isDark: boolean;
  t: (key: string) => string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  isDark,
  t,
}) => {
  const styles = getStyles(isDark);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t("settings.title")}</Text>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    header: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    title: {
      fontSize: FontSizes.display,
      fontWeight: FontWeights.bold,
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: FontSizes.bodyLg,
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
  });

import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SettingsHeaderProps {
  isDark: boolean;
  t: (key: string) => string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ isDark, t }) => {
  const styles = getStyles(isDark);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t("settings.title")}</Text>
      <Text style={styles.subtitle}>{t("settings.subtitle")}</Text>
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
      fontSize: 34,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
  });

import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function ComingSoonScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f2f2f7" },
      ]}
    >
      <Stack.Screen
        options={{
          title: t("settings.language.japanese"),
          headerStyle: { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
          headerTitleStyle: { color: isDark ? "#fff" : "#000" },
          headerTintColor: "#007AFF",
        }}
      />
      <View style={styles.messageBox}>
        <Ionicons
          name="time-outline"
          size={72}
          color={isDark ? "#555" : "#c7c7cc"}
        />
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          {t("comingSoon.title")}
        </Text>
        <Text
          style={[styles.description, { color: isDark ? "#8e8e93" : "#6e6e73" }]}
        >
          {t("comingSoon.description")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  messageBox: {
    alignItems: "center",
    gap: 16,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

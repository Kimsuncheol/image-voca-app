import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";

export default function ComingSoonScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const fontColors = getFontColors(isDark);

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
          headerTitleStyle: { color: fontColors.screenTitle },
          headerTintColor: "#007AFF",
        }}
      />
      <View style={styles.messageBox}>
        <Ionicons
          name="time-outline"
          size={72}
          color={isDark ? "#555" : "#c7c7cc"}
        />
        <Text style={[styles.title, { color: fontColors.screenTitle }]}>
          {t("comingSoon.title")}
        </Text>
        <Text
          style={[styles.description, { color: fontColors.screenMuted }]}
        >
          {t("comingSoon.description")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/japanese-characters")}
          activeOpacity={0.6}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: fontColors.actionAccent }]}>
            {t("kana.title")}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/course/jlpt-levels")}
          activeOpacity={0.6}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: fontColors.actionAccent }]}>
            {t("comingSoon.links.jlptVocabulary")}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/wordbank")}
          activeOpacity={0.6}
          style={styles.link}
        >
          <Text style={[styles.linkText, { color: fontColors.actionAccent }]}>
            {t("comingSoon.links.wordBank")}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#007AFF" />
        </TouchableOpacity>
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
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 8,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

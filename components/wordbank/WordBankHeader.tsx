import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { WordBankSettingsModal } from "../course-wordbank/WordBankSettingsModal";
import { ThemedText } from "../themed-text";
import { useTheme } from "../../src/context/ThemeContext";
import { useWordBankDisplayStore } from "../../src/stores/wordBankDisplayStore";

export function WordBankHeader() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { loadSettings } = useWordBankDisplayStore();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <ThemedText type="title">{t("wordBank.title")}</ThemedText>
          <ThemedText style={styles.subtitle}>{t("wordBank.subtitle")}</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <WordBankSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        isDark={isDark}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 4,
  },
  settingsButton: {
    padding: 4,
    marginTop: 4,
  },
});

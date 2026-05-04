import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { LanguageMode } from "../../src/i18n";

interface LanguageSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  currentMode: LanguageMode;
  t: (key: string) => string;
}

export function LanguageSection({
  styles,
  isDark,
  currentMode,
  t,
}: LanguageSectionProps) {
  const router = useRouter();
  const options: {
    mode: LanguageMode;
    label: string;
  }[] = [
    { mode: "system", label: t("settings.language.systemDefault") },
    { mode: "en-US", label: t("settings.language.englishUnitedStates") },
    { mode: "en-GB", label: t("settings.language.englishUnitedKingdom") },
    { mode: "ko", label: t("settings.language.korean") },
    { mode: "ja", label: t("settings.language.japanese") },
    { mode: "es", label: t("settings.language.spanish") },
    { mode: "fr", label: t("settings.language.french") },
    { mode: "ru", label: t("settings.language.russian") },
    { mode: "de", label: t("settings.language.german") },
    { mode: "it", label: t("settings.language.italian") },
    { mode: "hi", label: t("settings.language.hindi") },
  ];
  const currentLabel =
    options.find((option) => option.mode === currentMode)?.label ??
    t("settings.language.systemDefault");

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.language.title")}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          testID="settings-language-row"
          style={styles.option}
          onPress={() => router.push("/settings-language")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="language-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>
                {t("settings.language.title")}
              </Text>
            </View>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>{currentLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { LanguageMode } from "../../src/i18n";
import {
  getLanguageModeOptions,
  getLanguageModeSummary,
} from "../../src/utils/languageModeOptions";

interface LanguageSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  currentMode: LanguageMode;
  t: (key: string, options?: { defaultValue?: string }) => string;
}

export function LanguageSection({
  styles,
  isDark,
  currentMode,
  t,
}: LanguageSectionProps) {
  const router = useRouter();
  const options = getLanguageModeOptions(t);
  const currentOption = options.find((option) => option.mode === currentMode);
  const currentLabel = currentOption
    ? getLanguageModeSummary(currentOption, t)
    : t("settings.language.systemDefault");

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

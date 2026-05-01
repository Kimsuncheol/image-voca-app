import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { LanguageMode } from "../../src/i18n";

interface LanguageSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  currentMode: LanguageMode;
  onChangeLanguageMode: (mode: LanguageMode) => void;
  t: (key: string) => string;
}

export function LanguageSection({
  styles,
  isDark,
  currentMode,
  onChangeLanguageMode,
  t,
}: LanguageSectionProps) {
  const options: {
    mode: LanguageMode;
    label: string;
  }[] = [
    { mode: "system", label: t("settings.language.systemDefault") },
    { mode: "en", label: t("settings.language.english") },
    { mode: "ko", label: t("settings.language.korean") },
    { mode: "ja", label: t("settings.language.japanese") },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.language.title")}</Text>
      <View style={styles.card}>
        {options.map((option, index) => (
          <React.Fragment key={option.mode}>
            {index > 0 && <View style={styles.separator} />}
            <TouchableOpacity
              style={styles.option}
              onPress={() => onChangeLanguageMode(option.mode)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={
                    option.mode === "system"
                      ? "phone-portrait-outline"
                      : "language-outline"
                  }
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <View style={styles.optionTextGroup}>
                  <Text style={styles.optionText}>{option.label}</Text>
                </View>
              </View>
              {currentMode === option.mode && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface LanguageSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  currentLanguage: string;
  onChangeLanguage: (language: "en" | "ko") => void;
  t: (key: string) => string;
}

export function LanguageSection({
  styles,
  isDark,
  currentLanguage,
  onChangeLanguage,
  t,
}: LanguageSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.language.title")}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => onChangeLanguage("en")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="language-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.language.english")}
            </Text>
          </View>
          {currentLanguage === "en" && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.option}
          onPress={() => onChangeLanguage("ko")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="language-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>
              {t("settings.language.korean")}
            </Text>
          </View>
          {currentLanguage === "ko" && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

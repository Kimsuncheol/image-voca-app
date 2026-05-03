import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { LearningLanguage } from "../../src/types/vocabulary";

interface Props {
  styles: Record<string, any>;
  isDark: boolean;
}

export function LearningLanguageSection({ styles, isDark }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { learningLanguage } = useLearningLanguage();

  const labels: Record<LearningLanguage, string> = {
    en: "English",
    ja: "Japanese",
  };
  const currentLabel = t(
    `settings.language.${learningLanguage === "ja" ? "japanese" : "english"}`,
    {
      defaultValue: labels[learningLanguage],
    },
  );
  const title = t("settings.language.learningLanguage");

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          testID="settings-learning-language-row"
          style={styles.option}
          onPress={() => router.push("/settings-learning-language")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="globe-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <View style={styles.optionTextGroup}>
              <Text style={styles.optionText}>{title}</Text>
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

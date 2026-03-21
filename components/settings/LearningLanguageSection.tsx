import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { LearningLanguage } from "../../src/types/vocabulary";

interface Props {
  styles: Record<string, any>;
  isDark: boolean;
}

export function LearningLanguageSection({ styles, isDark }: Props) {
  const { t } = useTranslation();
  const { learningLanguage, setLearningLanguage } = useLearningLanguage();

  const labels: Record<LearningLanguage, string> = {
    en: "English",
    ja: "Japanese",
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.language.wishToLearn")}</Text>
      <View style={styles.card}>
        {(["en", "ja"] as LearningLanguage[]).map((language, index) => (
          <React.Fragment key={language}>
            {index > 0 && <View style={styles.separator} />}
            <TouchableOpacity
              style={styles.option}
              onPress={() => void setLearningLanguage(language)}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={isDark ? "#fff" : "#333"}
                />
                <Text style={styles.optionText}>
                  {t(`settings.language.${language === "ja" ? "japanese" : "english"}`, {
                    defaultValue: labels[language],
                  })}
                </Text>
              </View>
              {learningLanguage === language && (
                <Ionicons name="checkmark" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

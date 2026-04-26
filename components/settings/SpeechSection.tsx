import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useSpeechPreferences } from "../../src/hooks/useSpeechPreferences";
import {
import { FontSizes } from "@/constants/fontSizes";
  SpeechPreferenceLanguage,
  getNextSpeechSpeedPreset,
} from "../../src/services/speechPreferences";

interface SpeechSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
}

export function SpeechSection({ styles, isDark }: SpeechSectionProps) {
  const { t } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const { getPreset, setPreset } = useSpeechPreferences();
  const speechLanguage: SpeechPreferenceLanguage =
    learningLanguage === "ja" ? "ja" : "en";
  const selectedPreset = getPreset(speechLanguage);
  const togglePreset = async () => {
    const result = await setPreset(
      speechLanguage,
      getNextSpeechSpeedPreset(selectedPreset),
    );

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.speech.title")}</Text>
      <View style={styles.card}>
        <View style={[styles.option, localStyles.option]}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="volume-high-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text
              testID="speech-speed-label"
              style={styles.optionText}
              numberOfLines={2}
            >
              {t("settings.speech.title")}
            </Text>
          </View>

          <TouchableOpacity
            testID="speech-speed-preset-toggle"
            accessibilityRole="button"
            accessibilityLabel={t("settings.speech.title")}
            style={[
              localStyles.presetToggle,
              {
                backgroundColor: isDark ? "#0a84ff" : "#007AFF",
              },
            ]}
            onPress={() => {
              void togglePreset();
            }}
          >
            <Ionicons name="speedometer-outline" size={16} color="#fff" />
            <Text style={localStyles.presetText}>
              {t(`settings.speech.${selectedPreset}`)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  option: {
    gap: 12,
  },
  presetToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
    minHeight: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
  },
  presetText: {
    color: "#fff",
    fontSize: FontSizes.label,
    fontWeight: "700",
  },
});

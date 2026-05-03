import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useSpeechPreferences } from "../../src/hooks/useSpeechPreferences";
import type { SpeechPreferenceLanguage } from "../../src/services/speechPreferences";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface SpeechSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
}

export function SpeechSection({ styles, isDark }: SpeechSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { learningLanguage } = useLearningLanguage();
  const {
    getPreset,
    vocabularyPreferences,
    setAutoSpeakVocabulary,
  } = useSpeechPreferences();
  const speechLanguage: SpeechPreferenceLanguage =
    learningLanguage === "ja" ? "ja" : "en";
  const selectedPreset = getPreset(speechLanguage);
  const selectedPresetLabel = t(`settings.speech.${selectedPreset}`);

  const handleAutoSpeakChange = async (enabled: boolean) => {
    const result = await setAutoSpeakVocabulary(enabled);

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  const selectedMaskTarget = vocabularyPreferences.reviewMaskTarget;
  const selectedMaskTargetLabel = t(
    `settings.speech.maskTargets.${selectedMaskTarget}`,
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.speech.title")}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          testID="settings-speech-speed-row"
          style={[styles.option, localStyles.option]}
          onPress={() => router.push("/settings-speech-speed")}
        >
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
              {t("settings.speech.speed")}
            </Text>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>{selectedPresetLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
          </View>
        </TouchableOpacity>
        <View testID="speech-section-separator" style={styles.separator} />
        <View style={[styles.option, localStyles.option]}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="volume-medium-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text
              testID="auto-vocabulary-speech-label"
              style={styles.optionText}
              numberOfLines={2}
            >
              {t("settings.speech.autoVocabularySpeech")}
            </Text>
          </View>
          <ToggleSwitch
            value={vocabularyPreferences.autoSpeakVocabulary}
            onValueChange={(enabled) => {
              void handleAutoSpeakChange(enabled);
            }}
            trackColor={{
              false: "#767577",
              true: isDark ? "#0a84ff" : "#007AFF",
            }}
          />
        </View>
        <View testID="speech-section-separator" style={styles.separator} />
        <TouchableOpacity
          testID="settings-review-mask-target-row"
          style={[styles.option, localStyles.option]}
          onPress={() => router.push("/settings-review-mask-target")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="eye-off-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text
              testID="review-mask-target-label"
              style={styles.optionText}
              numberOfLines={2}
            >
              {t("settings.speech.reviewMaskTarget")}
            </Text>
          </View>
          <View style={styles.optionRight}>
            <Text style={styles.optionValue}>{selectedMaskTargetLabel}</Text>
            <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  option: {
    gap: 12,
  },
});

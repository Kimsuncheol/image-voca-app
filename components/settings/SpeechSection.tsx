import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useSpeechPreferences } from "../../src/hooks/useSpeechPreferences";
import { FontSizes } from "@/constants/fontSizes";
import {
  ReviewMaskTarget,
  SpeechPreferenceLanguage,
  getNextSpeechSpeedPreset,
} from "../../src/services/speechPreferences";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface SpeechSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
}

export function SpeechSection({ styles, isDark }: SpeechSectionProps) {
  const { t } = useTranslation();
  const { learningLanguage } = useLearningLanguage();
  const {
    getPreset,
    setPreset,
    vocabularyPreferences,
    setAutoSpeakVocabulary,
    setReviewMaskTarget,
  } = useSpeechPreferences();
  const speechLanguage: SpeechPreferenceLanguage =
    learningLanguage === "ja" ? "ja" : "en";
  const selectedPreset = getPreset(speechLanguage);
  const speedLabelKey =
    speechLanguage === "ja"
      ? "settings.speech.japaneseSpeed"
      : "settings.speech.englishSpeed";
  const maskTargetOptions: ReviewMaskTarget[] = [
    "word-pronunciation",
    "meaning",
    "all",
  ];
  const togglePreset = async () => {
    const result = await setPreset(
      speechLanguage,
      getNextSpeechSpeedPreset(selectedPreset),
    );

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  const handleAutoSpeakChange = async (enabled: boolean) => {
    const result = await setAutoSpeakVocabulary(enabled);

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  const handleMaskTargetChange = async (target: ReviewMaskTarget) => {
    const result = await setReviewMaskTarget(target);

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
              {t(speedLabelKey)}
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
            trackColor={{ false: "#767577", true: isDark ? "#0a84ff" : "#007AFF" }}
          />
        </View>
        <View style={[styles.option, localStyles.maskTargetOption]}>
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
          <View
            testID="review-mask-target-selector"
            style={[
              localStyles.segmentedControl,
              {
                backgroundColor: isDark ? "#1f2937" : "#f2f2f7",
                borderColor: isDark ? "#374151" : "#d1d1d6",
              },
            ]}
          >
            {maskTargetOptions.map((target) => {
              const isSelected =
                vocabularyPreferences.reviewMaskTarget === target;

              return (
                <TouchableOpacity
                  key={target}
                  testID={`review-mask-target-${target}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.78}
                  onPress={() => {
                    void handleMaskTargetChange(target);
                  }}
                  style={[
                    localStyles.segmentButton,
                    isSelected && {
                      backgroundColor: isDark ? "#0a84ff" : "#007AFF",
                    },
                  ]}
                >
                  <Text
                    style={[
                      localStyles.segmentText,
                      {
                        color: isSelected
                          ? "#fff"
                          : isDark
                            ? "#e5e7eb"
                            : "#1f2937",
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {t(`settings.speech.maskTargets.${target}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  option: {
    gap: 12,
  },
  maskTargetOption: {
    flexDirection: "column",
    alignItems: "stretch",
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
    fontWeight: FontWeights.bold,
  },
  segmentedControl: {
    flexDirection: "row",
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  segmentButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  segmentText: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
    textAlign: "center",
  },
});

import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useSpeechPreferences } from "../../src/hooks/useSpeechPreferences";
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
              {t("settings.speech.speed")}
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
            style={localStyles.maskTargetList}
          >
            {maskTargetOptions.map((target, index) => {
              const isSelected =
                vocabularyPreferences.reviewMaskTarget === target;
              const selectedColor = isDark ? "#0a84ff" : "#007AFF";
              const unselectedColor = isDark ? "#e5e7eb" : "#1f2937";

              return (
                <React.Fragment key={target}>
                  <TouchableOpacity
                    testID={`review-mask-target-${target}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    activeOpacity={0.78}
                    onPress={() => {
                      void handleMaskTargetChange(target);
                    }}
                    style={localStyles.maskTargetTextOption}
                  >
                    <Text
                      style={[
                        localStyles.maskTargetText,
                        { color: isSelected ? selectedColor : unselectedColor },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.86}
                    >
                      {t(`settings.speech.maskTargets.${target}`)}
                    </Text>
                  </TouchableOpacity>
                  {index < maskTargetOptions.length - 1 && (
                    <View
                      testID="review-mask-target-option-divider"
                      style={[
                        localStyles.maskTargetOptionDivider,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.14)"
                            : "#d1d1d6",
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
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
  maskTargetList: {
    flexDirection: "column",
    alignSelf: "stretch",
    paddingLeft: 32,
  },
  maskTargetTextOption: {
    alignSelf: "flex-start",
    minHeight: 28,
    justifyContent: "center",
  },
  maskTargetText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.medium,
  },
  maskTargetOptionDivider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
});

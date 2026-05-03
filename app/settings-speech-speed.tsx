import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TopBannerAd } from "../components/ads/TopBannerAd";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useLearningLanguage } from "../src/context/LearningLanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeechPreferences } from "../src/hooks/useSpeechPreferences";
import type {
  SpeechPreferenceLanguage,
  SpeechSpeedPreset,
} from "../src/services/speechPreferences";

const SPEECH_SPEED_OPTIONS: SpeechSpeedPreset[] = ["slow", "normal", "fast"];

export default function SettingsSpeechSpeedScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { learningLanguage } = useLearningLanguage();
  const { getPreset, setPreset } = useSpeechPreferences();
  const styles = getStyles(isDark);
  const speechLanguage: SpeechPreferenceLanguage =
    learningLanguage === "ja" ? "ja" : "en";
  const selectedPreset = getPreset(speechLanguage);

  const handleChangePreset = async (preset: SpeechSpeedPreset) => {
    const result = await setPreset(speechLanguage, preset);

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  return (
    <View style={styles.container} testID="settings-speech-speed-screen">
      <Stack.Screen
        options={{
          title: t("settings.speech.speed"),
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <TopBannerAd includeTopInset={false} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.speech.speed")}</Text>
          <View style={styles.card}>
            {SPEECH_SPEED_OPTIONS.map((preset, index) => {
              const isSelected = selectedPreset === preset;

              return (
                <React.Fragment key={preset}>
                  {index > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    testID={`settings-speech-speed-option-${preset}`}
                    style={styles.option}
                    onPress={() => {
                      void handleChangePreset(preset);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name="speedometer-outline"
                        size={24}
                        color={isDark ? "#fff" : "#333"}
                      />
                      <Text style={styles.optionText}>
                        {t(`settings.speech.${preset}`)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        testID={`settings-speech-speed-check-${preset}`}
                        name="checkmark"
                        size={24}
                        color="#007AFF"
                      />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg.screenAlt,
      paddingHorizontal: 16,
    },
    header: {
      backgroundColor: bg.screenAlt,
    },
    headerTitle: {
      color: fontColors.screenTitle,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      marginTop: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.semiBold,
      color: fontColors.screenMuted,
      marginBottom: 8,
      marginLeft: 12,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: bg.surfaceElevated,
      borderRadius: 10,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    optionText: {
      color: fontColors.screenTitle,
      fontSize: FontSizes.subhead,
      marginLeft: 8,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.divider,
      marginLeft: 52,
    },
  });
};

import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
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
import type { LearningLanguage } from "../src/types/vocabulary";

const LEARNING_LANGUAGE_OPTIONS: LearningLanguage[] = ["en", "ja"];

export default function SettingsLearningLanguageScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { learningLanguage, setLearningLanguage } = useLearningLanguage();
  const styles = getStyles(isDark);
  const title = t("settings.language.learningLanguage");

  const labels: Record<LearningLanguage, string> = {
    en: "English",
    ja: "Japanese",
  };
  const flags: Record<LearningLanguage, string> = {
    en: "🇺🇸",
    ja: "🇯🇵",
  };

  const getLabel = (language: LearningLanguage) =>
    t(`settings.language.${language === "ja" ? "japanese" : "english"}`, {
      defaultValue: labels[language],
    });

  return (
    <View style={styles.container} testID="settings-learning-language-screen">
      <Stack.Screen
        options={{
          title,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <TopBannerAd includeTopInset={false} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.card}>
            {LEARNING_LANGUAGE_OPTIONS.map((language, index) => {
              const isSelected = learningLanguage === language;

              return (
                <React.Fragment key={language}>
                  {index > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    testID={`settings-learning-language-option-${language}`}
                    style={styles.option}
                    onPress={() => {
                      void setLearningLanguage(language);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.flagText}>{flags[language]}</Text>
                      <Text style={styles.optionText}>{getLabel(language)}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        testID={`settings-learning-language-check-${language}`}
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
    flagText: {
      width: 24,
      height: 24,
      fontSize: 24,
      lineHeight: 24,
      textAlign: "center",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.divider,
      marginLeft: 52,
    },
  });
};

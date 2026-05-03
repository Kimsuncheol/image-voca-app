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
import { useTheme } from "../src/context/ThemeContext";
import { setLanguageMode, type LanguageMode } from "../src/i18n";
import { useLanguageSettingsStore } from "../src/stores/languageSettingsStore";
import {
  getStudyReminderEnabledPreference,
  scheduleDailyNotifications,
} from "../src/utils/notifications";

export default function SettingsLanguageScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const mode = useLanguageSettingsStore((state) => state.mode);
  const styles = getStyles(isDark);

  const options: {
    mode: LanguageMode;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      mode: "system",
      label: t("settings.language.systemDefault"),
      icon: "phone-portrait-outline",
    },
    {
      mode: "en",
      label: t("settings.language.english"),
      icon: "language-outline",
    },
    {
      mode: "ko",
      label: t("settings.language.korean"),
      icon: "language-outline",
    },
    {
      mode: "ja",
      label: t("settings.language.japanese"),
      icon: "language-outline",
    },
  ];

  const handleChangeLanguageMode = async (nextMode: LanguageMode) => {
    try {
      await setLanguageMode(nextMode);
      if (await getStudyReminderEnabledPreference()) {
        await scheduleDailyNotifications();
      }
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  return (
    <View style={styles.container} testID="settings-language-screen">
      <Stack.Screen
        options={{
          title: t("settings.language.title"),
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <TopBannerAd includeTopInset={false} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.language.title")}</Text>
          <View style={styles.card}>
            {options.map((option, index) => (
              <React.Fragment key={option.mode}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  testID={`settings-language-option-${option.mode}`}
                  style={styles.option}
                  onPress={() => {
                    void handleChangeLanguageMode(option.mode);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={isDark ? "#fff" : "#333"}
                    />
                    <Text style={styles.optionText}>{option.label}</Text>
                  </View>
                  {mode === option.mode && (
                    <Ionicons
                      testID={`settings-language-check-${option.mode}`}
                      name="checkmark"
                      size={24}
                      color="#007AFF"
                    />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
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

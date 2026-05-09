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
import { SafeAreaView } from "react-native-safe-area-context";

import { TopBannerAd } from "../components/ads/TopBannerAd";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguageSettingsStore } from "../src/stores/languageSettingsStore";
import {
  changeLanguageModeWithSideEffects,
  getLanguageModeOptions,
} from "../src/utils/languageModeOptions";

export default function SettingsLanguageScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const mode = useLanguageSettingsStore((state) => state.mode);
  const styles = getStyles(isDark);

  const options = getLanguageModeOptions(t);

  const handleChangeLanguageMode = async (
    nextMode: (typeof options)[number]["mode"],
  ) => {
    try {
      await changeLanguageModeWithSideEffects(nextMode);
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={styles.container}
      testID="settings-language-screen"
    >
      <Stack.Screen
        options={{
          title: t("settings.language.title"),
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <TopBannerAd includeTopInset={false} />
      <ScrollView
        testID="settings-language-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                    {option.flag ? (
                      <Text style={styles.flagText}>{option.flag}</Text>
                    ) : (
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={isDark ? "#fff" : "#333"}
                      />
                    )}
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
    </SafeAreaView>
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
    scrollContent: {
      flexGrow: 1,
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

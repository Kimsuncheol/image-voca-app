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
import { useTheme } from "../src/context/ThemeContext";
import { useSpeechPreferences } from "../src/hooks/useSpeechPreferences";
import type { ReviewMaskTarget } from "../src/services/speechPreferences";

const REVIEW_MASK_OPTIONS: ReviewMaskTarget[] = [
  "word-pronunciation",
  "meaning",
  "synonym",
  "all",
];

export default function SettingsReviewMaskTargetScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { vocabularyPreferences, setReviewMaskTarget } = useSpeechPreferences();
  const styles = getStyles(isDark);

  const handleChangeReviewMaskTarget = async (target: ReviewMaskTarget) => {
    const result = await setReviewMaskTarget(target);

    if (!result.persistedLocally) {
      Alert.alert(t("common.error"), t("settings.speech.saveFailed"));
    }
  };

  return (
    <View style={styles.container} testID="settings-review-mask-target-screen">
      <Stack.Screen
        options={{
          title: t("settings.speech.reviewMaskTarget"),
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
          <Text style={styles.sectionTitle}>
            {t("settings.speech.reviewMaskTarget")}
          </Text>
          <View style={styles.card}>
            {REVIEW_MASK_OPTIONS.map((target, index) => {
              const isSelected =
                vocabularyPreferences.reviewMaskTarget === target;

              return (
                <React.Fragment key={target}>
                  {index > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    testID={`settings-review-mask-target-option-${target}`}
                    style={styles.option}
                    onPress={() => {
                      void handleChangeReviewMaskTarget(target);
                    }}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name="eye-off-outline"
                        size={24}
                        color={isDark ? "#fff" : "#333"}
                      />
                      <Text style={styles.optionText}>
                        {t(`settings.speech.maskTargets.${target}`)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        testID={`settings-review-mask-target-check-${target}`}
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

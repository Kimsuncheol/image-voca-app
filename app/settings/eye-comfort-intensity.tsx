import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import Slider from "@react-native-community/slider";
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

import { TopBannerAd } from "../../components/ads/TopBannerAd";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";
import { useEyeComfort } from "../../src/hooks/useEyeComfort";
import {
  EYE_COMFORT_LEVELS,
  type EyeComfortLevel,
} from "../../src/utils/eyeComfortColors";

interface CustomIntensitySliderProps {
  value: number;
  isDark: boolean;
  label: string;
  styles: Record<string, any>;
  onChange: (value: number) => void;
}

function CustomIntensitySlider({
  value,
  isDark,
  label,
  styles,
  onChange,
}: CustomIntensitySliderProps) {
  const normalizedValue = Math.min(100, Math.max(0, Math.round(value)));
  const inactiveColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(17, 24, 39, 0.12)";
  const activeColor = "#FF9500";
  const thumbColor = isDark ? "#f2f2f7" : "#fff";

  return (
    <View style={styles.sliderContainer} testID="eye-comfort-custom-slider">
      <View style={styles.sliderHeader}>
        <Text
          style={[
            styles.sliderLabel,
            { color: isDark ? "#f2f2f7" : "#111827" },
          ]}
        >
          {label}
        </Text>
        <Text
          testID="eye-comfort-custom-slider-value"
          style={[
            styles.sliderValue,
            { color: isDark ? "#a1a1aa" : "#6b7280" },
          ]}
        >
          {normalizedValue}%
        </Text>
      </View>
      <Slider
        testID="eye-comfort-custom-slider-control"
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={normalizedValue}
        minimumTrackTintColor={activeColor}
        maximumTrackTintColor={inactiveColor}
        thumbTintColor={thumbColor}
        onValueChange={onChange}
        style={styles.slider}
      />
    </View>
  );
}

export default function EyeComfortIntensityScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { level, customIntensity, setLevel, setCustomIntensity } =
    useEyeComfort();
  const styles = getStyles(isDark);

  const getLevelLabel = (candidate: EyeComfortLevel) =>
    t(`settings.eyeComfort.levels.${candidate}`, {
      defaultValue:
        candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase(),
    });

  return (
    <View style={styles.container} testID="eye-comfort-intensity-screen">
      <Stack.Screen
        options={{
          title: t("settings.eyeComfort.intensityTitle", {
            defaultValue: "Eye Comfort Intensity",
          }),
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
            {t("settings.eyeComfort.intensity", {
              defaultValue: "Intensity",
            })}
          </Text>
          <View style={styles.card}>
            {EYE_COMFORT_LEVELS.map((candidate, index) => {
              const isSelected = candidate === level;

              return (
                <React.Fragment key={candidate}>
                  {index > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    testID={`eye-comfort-intensity-option-${candidate}`}
                    style={styles.option}
                    onPress={() => setLevel(candidate)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name="color-filter-outline"
                        size={24}
                        color={isDark ? "#fff" : "#333"}
                      />
                      <Text style={styles.optionText}>
                        {getLevelLabel(candidate)}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        testID={`eye-comfort-intensity-check-${candidate}`}
                        name="checkmark"
                        size={24}
                        color="#007AFF"
                      />
                    ) : null}
                  </TouchableOpacity>
                  {candidate === "custom" && level === "custom" ? (
                    <CustomIntensitySlider
                      value={customIntensity}
                      isDark={isDark}
                      label={t("settings.eyeComfort.customIntensity", {
                        defaultValue: "Custom intensity",
                      })}
                      styles={styles}
                      onChange={setCustomIntensity}
                    />
                  ) : null}
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
    sliderContainer: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 18,
      gap: 12,
    },
    sliderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sliderLabel: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.medium,
    },
    sliderValue: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.semiBold,
      fontVariant: ["tabular-nums"],
    },
    slider: {
      transform: [{ scaleY: 1.0 }],
    },
  });
};

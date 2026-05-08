import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  GestureResponderEvent,
  GestureResponderHandlers,
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
  const trackRef = React.useRef<View>(null);
  const trackMetricsRef = React.useRef({ x: 0, width: 0 });
  const normalizedValue = Math.min(100, Math.max(0, Math.round(value)));
  const fillPercent = `${normalizedValue}%`;
  const inactiveColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(17, 24, 39, 0.12)";
  const activeColor = "#FF9500";
  const thumbColor = isDark ? "#FFD1A3" : "#C75B00";

  const updateFromTrackOffset = React.useCallback(
    (offsetX: number, measuredWidth = trackMetricsRef.current.width) => {
      if (measuredWidth <= 0) {
        return;
      }

      const clampedOffset = Math.min(measuredWidth, Math.max(0, offsetX));
      const nextValue = (clampedOffset / measuredWidth) * 100;
      onChange(nextValue);
    },
    [onChange],
  );

  const measureTrack = React.useCallback(
    (callback?: (metrics: { x: number; width: number }) => void) => {
      trackRef.current?.measureInWindow?.((x, _y, width) => {
        if (width > 0) {
          trackMetricsRef.current = { x, width };
          callback?.({ x, width });
        }
      });
    },
    [],
  );

  const updateFromAbsoluteX = React.useCallback(
    (absoluteX: number) => {
      const metrics = trackMetricsRef.current;

      if (metrics.width <= 0) {
        measureTrack((nextMetrics) => {
          updateFromTrackOffset(absoluteX - nextMetrics.x, nextMetrics.width);
        });
        return;
      }

      updateFromTrackOffset(absoluteX - metrics.x, metrics.width);
    },
    [measureTrack, updateFromTrackOffset],
  );

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackMetricsRef.current = {
      ...trackMetricsRef.current,
      width,
    };
    measureTrack();
  };

  const handleTrackPress = (event: GestureResponderEvent) => {
    updateFromTrackOffset(event.nativeEvent.locationX);
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event, gestureState) => {
          measureTrack();
          const absoluteX =
            event.nativeEvent.pageX ?? gestureState.x0 ?? 0;
          updateFromAbsoluteX(absoluteX);
        },
        onPanResponderMove: (_event, gestureState) => {
          updateFromAbsoluteX(gestureState.moveX);
        },
      }),
    [measureTrack, updateFromAbsoluteX],
  );
  const testThumbHandlers = React.useMemo(
    () =>
      process.env.NODE_ENV === "test"
        ? {
            testOnly_onThumbGrant: updateFromAbsoluteX,
            testOnly_onThumbMove: updateFromAbsoluteX,
          }
        : undefined,
    [updateFromAbsoluteX],
  );

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
      <Pressable
        ref={trackRef}
        testID="eye-comfort-custom-slider-track"
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: normalizedValue,
        }}
        onLayout={handleTrackLayout}
        onPress={handleTrackPress}
        style={styles.sliderTrack}
      >
        <View
          style={[
            styles.sliderInactiveFill,
            { backgroundColor: inactiveColor },
          ]}
        />
        <View
          style={[
            styles.sliderFill,
            { width: fillPercent, backgroundColor: activeColor },
          ]}
        />
        <View
          testID="eye-comfort-custom-slider-thumb"
          {...(panResponder.panHandlers as GestureResponderHandlers)}
          {...testThumbHandlers}
          style={[
            styles.sliderThumb,
            {
              left: fillPercent,
              backgroundColor: thumbColor,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.3)"
                : "rgba(0, 0, 0, 0.12)",
            },
          ]}
        />
      </Pressable>
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
    sliderTrack: {
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      overflow: "visible",
    },
    sliderInactiveFill: {
      height: 12,
      borderRadius: 6,
      position: "absolute",
      left: 0,
      right: 0,
    },
    sliderFill: {
      height: 12,
      borderRadius: 6,
      position: "absolute",
      left: 0,
    },
    sliderThumb: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      position: "absolute",
      marginLeft: -14,
    },
  });
};

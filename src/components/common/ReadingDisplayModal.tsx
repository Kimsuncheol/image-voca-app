import { getBackgroundColors } from "@/constants/backgroundColors";
import { getFontColors } from "@/constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import Slider from "@react-native-community/slider";
import {
  getDefaultHeaderHeight,
  HeaderHeightContext,
} from "@react-navigation/elements";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToggleSwitch } from "../../../components/common/ToggleSwitch";
import { useTheme } from "../../context/ThemeContext";
import {
  MAX_APP_BRIGHTNESS,
  MAX_EYE_COMFORT_INTENSITY,
  MIN_APP_BRIGHTNESS,
  MIN_EYE_COMFORT_INTENSITY,
  useReadingDisplayStore,
} from "../../stores/readingDisplayStore";

export function ReadingDisplayModal() {
  const { t } = useTranslation();
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerContextHeight = React.useContext(HeaderHeightContext);
  const windowDimensions = useWindowDimensions();
  const headerHeight =
    headerContextHeight ??
    getDefaultHeaderHeight(windowDimensions, false, insets.top);
  const styles = getStyles(isDark);
  const isOpen = useReadingDisplayStore(
    (state) => state.isDisplayModalOpen,
  );
  const brightnessMode = useReadingDisplayStore(
    (state) => state.brightnessMode,
  );
  const appBrightness = useReadingDisplayStore(
    (state) => state.appBrightness,
  );
  const eyeComfortEnabled = useReadingDisplayStore(
    (state) => state.eyeComfortEnabled,
  );
  const eyeComfortIntensity = useReadingDisplayStore(
    (state) => state.eyeComfortIntensity,
  );
  const isInitialized = useReadingDisplayStore(
    (state) => state._initialized,
  );
  const hydrate = useReadingDisplayStore((state) => state.hydrate);
  const closeDisplayModal = useReadingDisplayStore(
    (state) => state.closeDisplayModal,
  );
  const setBrightnessMode = useReadingDisplayStore(
    (state) => state.setBrightnessMode,
  );
  const setAppBrightness = useReadingDisplayStore(
    (state) => state.setAppBrightness,
  );
  const setEyeComfortEnabled = useReadingDisplayStore(
    (state) => state.setEyeComfortEnabled,
  );
  const setEyeComfortIntensity = useReadingDisplayStore(
    (state) => state.setEyeComfortIntensity,
  );
  const isAppBrightness = brightnessMode === "app";
  const sliderMinimumTrackTint = isDark ? "#0a84ff" : "#007AFF";
  const sliderMaximumTrackTint = isDark
    ? "rgba(255,255,255,0.18)"
    : "rgba(17,24,39,0.16)";
  const disabledTint = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(17,24,39,0.18)";
  const thumbTintColor = isDark ? "#f2f2f7" : "#fff";
  const intensityPercent = Math.round(eyeComfortIntensity * 100);

  useEffect(() => {
    if (!isInitialized) {
      void hydrate();
    }
  }, [hydrate, isInitialized]);

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={closeDisplayModal}
    >
      <Pressable
        testID="reading-display-modal-overlay"
        style={styles.overlay}
        onPress={closeDisplayModal}
      >
        <Pressable
          testID="reading-display-modal-panel"
          style={[
            styles.panel,
            { top: headerHeight - 30 },
          ]}
          onPress={(event) => event?.stopPropagation?.()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("readingDisplay.title", {
                defaultValue: "Reading display",
              })}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              {t("settings.appearance.title", {
                defaultValue: "Appearance",
              })}
            </Text>
            <View style={styles.appearanceRow}>
              {(["light", "dark", "system"] as const).map((mode) => {
                const isSelected = theme === mode;

                return (
                  <Pressable
                    key={mode}
                    testID={`reading-display-appearance-${mode}`}
                    style={[
                      styles.appearanceOption,
                      isSelected && styles.appearanceOptionSelected,
                    ]}
                    onPress={() => setTheme(mode)}
                  >
                    <View
                      testID={`reading-display-appearance-preview-${mode}`}
                      style={styles.appearancePreviewFrame}
                    >
                      {mode === "system" ? (
                        <View style={styles.systemPreview}>
                          <View
                            testID="reading-display-system-preview-light"
                            style={[
                              styles.systemPreviewHalf,
                              styles.lightPreview,
                            ]}
                          />
                          <View
                            testID="reading-display-system-preview-dark"
                            style={[
                              styles.systemPreviewHalf,
                              styles.darkPreview,
                            ]}
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.appearancePreview,
                            mode === "light"
                              ? styles.lightPreview
                              : styles.darkPreview,
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      testID={`reading-display-appearance-label-${mode}`}
                      style={[
                        styles.appearanceLabel,
                        isSelected && styles.appearanceLabelSelected,
                      ]}
                    >
                      {t(`settings.appearance.${mode}`, {
                        defaultValue:
                          mode === "light"
                            ? "Light"
                            : mode === "dark"
                              ? "Dark"
                              : "System",
                      })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>
                {t("readingDisplay.brightness", {
                  defaultValue: "Reading brightness",
                })}
              </Text>
              <Text style={styles.value}>
                {Math.round(appBrightness * 100)}%
              </Text>
            </View>
            <View style={styles.segmentedControl}>
              {(["system", "app"] as const).map((mode) => {
                const isSelected = brightnessMode === mode;

                return (
                  <Pressable
                    key={mode}
                    testID={`reading-display-brightness-mode-${mode}`}
                    style={[
                      styles.segment,
                      isSelected && styles.segmentSelected,
                    ]}
                    onPress={() => setBrightnessMode(mode)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected && styles.segmentTextSelected,
                      ]}
                    >
                      {t(`readingDisplay.brightnessModes.${mode}`, {
                        defaultValue:
                          mode === "system" ? "System" : "App",
                      })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={!isAppBrightness && styles.disabledRow}>
              <Slider
                testID="reading-display-brightness-slider"
                minimumValue={MIN_APP_BRIGHTNESS}
                maximumValue={MAX_APP_BRIGHTNESS}
                step={0.01}
                value={appBrightness}
                disabled={!isAppBrightness}
                minimumTrackTintColor={
                  isAppBrightness ? sliderMinimumTrackTint : disabledTint
                }
                maximumTrackTintColor={
                  isAppBrightness ? sliderMaximumTrackTint : disabledTint
                }
                thumbTintColor={thumbTintColor}
                onValueChange={setAppBrightness}
                style={styles.slider}
              />
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>
                {t("readingDisplay.eyeComfort", {
                  defaultValue: "Eye comfort mode",
                })}
              </Text>
              <ToggleSwitch
                value={eyeComfortEnabled}
                onValueChange={setEyeComfortEnabled}
                trackColor={{
                  false: "#767577",
                  true: isDark ? "#0a84ff" : "#007AFF",
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>
                {t("readingDisplay.intensity", {
                  defaultValue: "Intensity",
                })}
              </Text>
              <Text style={styles.value}>{intensityPercent}%</Text>
            </View>
            <View style={!eyeComfortEnabled && styles.disabledRow}>
              <Slider
                testID="reading-display-eye-comfort-intensity-slider"
                minimumValue={MIN_EYE_COMFORT_INTENSITY}
                maximumValue={MAX_EYE_COMFORT_INTENSITY}
                step={0.01}
                value={eyeComfortIntensity}
                disabled={!eyeComfortEnabled}
                minimumTrackTintColor={
                  eyeComfortEnabled ? "#FF9500" : disabledTint
                }
                maximumTrackTintColor={
                  eyeComfortEnabled ? sliderMaximumTrackTint : disabledTint
                }
                thumbTintColor={thumbTintColor}
                onValueChange={setEyeComfortIntensity}
                style={styles.slider}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const font = getFontColors(isDark);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.28)",
    },
    panel: {
      position: "absolute",
      left: 16,
      right: 16,
      alignSelf: "flex-end",
      width: "auto",
      maxWidth: 360,
      borderRadius: 24,
      borderCurve: "continuous",
      backgroundColor: bg.surfaceElevated,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 16,
      gap: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.16)"
        : "rgba(17,24,39,0.08)",
    },
    header: {
      alignItems: "center",
    },
    title: {
      color: font.screenTitle,
      fontSize: FontSizes.title,
      fontWeight: FontWeights.semiBold,
    },
    section: {
      gap: 12,
    },
    appearanceRow: {
      flexDirection: "row",
      gap: 8,
    },
    appearanceOption: {
      flex: 1,
      minHeight: 88,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark
        ? "rgba(255,255,255,0.14)"
        : "rgba(17,24,39,0.12)",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    appearanceOptionSelected: {
      borderColor: "#007AFF",
      borderWidth: 2,
    },
    appearancePreviewFrame: {
      width: 62,
      height: 36,
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(17,24,39,0.16)",
    },
    appearancePreview: {
      flex: 1,
    },
    systemPreview: {
      flex: 1,
      flexDirection: "row",
    },
    systemPreviewHalf: {
      flex: 1,
    },
    lightPreview: {
      backgroundColor: "#fff",
    },
    darkPreview: {
      backgroundColor: "#000",
    },
    appearanceLabel: {
      color: font.screenMuted,
      fontSize: FontSizes.caption,
      fontWeight: FontWeights.medium,
    },
    appearanceLabelSelected: {
      color: font.screenTitle,
      fontWeight: FontWeights.semiBold,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    label: {
      flex: 1,
      color: font.screenTitle,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.medium,
    },
    value: {
      color: font.screenMuted,
      fontSize: FontSizes.body,
      fontVariant: ["tabular-nums"],
    },
    segmentedControl: {
      flexDirection: "row",
      padding: 3,
      borderRadius: 12,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(17,24,39,0.06)",
      gap: 3,
    },
    segment: {
      flex: 1,
      minHeight: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
    },
    segmentSelected: {
      backgroundColor: bg.surfaceElevated,
    },
    segmentText: {
      color: font.screenMuted,
      fontSize: FontSizes.body,
      fontWeight: FontWeights.medium,
    },
    segmentTextSelected: {
      color: font.screenTitle,
      fontWeight: FontWeights.semiBold,
    },
    disabledRow: {
      opacity: 0.45,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.separator,
    },
    slider: {
      transform: [{ scaleY: 1.0 }],
    },
  });
};

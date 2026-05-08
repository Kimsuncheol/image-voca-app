import { FontSizes } from "@/constants/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useEyeComfort } from "../../hooks/useEyeComfort";

interface EyeComfortHeaderButtonProps {
  testID?: string;
}

export function EyeComfortHeaderButton({
  testID = "eye-comfort-header-button",
}: EyeComfortHeaderButtonProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { isEnabled, toggle } = useEyeComfort();
  const label = t("settings.eyeComfort.toggleLabel", {
    defaultValue: "Eye Comfort Mode",
  });
  const activeIconColor = isDark ? "#FFD1A3" : "#C75B00";
  const inactiveIconColor = isDark ? "#f2f2f7" : "#1f2937";

  return (
    <Pressable
      testID={testID}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isEnabled }}
      hitSlop={8}
      style={[
        styles.button,
        {
          backgroundColor: isEnabled
            ? isDark
              ? "rgba(255, 150, 80, 0.18)"
              : "rgba(255, 160, 60, 0.18)"
            : isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(17, 24, 39, 0.06)",
          borderColor: isEnabled
            ? isDark
              ? "rgba(255, 209, 163, 0.48)"
              : "rgba(199, 91, 0, 0.36)"
            : "transparent",
        },
      ]}
    >
      <Ionicons
        name={isEnabled ? "eye" : "eye-outline"}
        size={FontSizes.bodyLg}
        color={isEnabled ? activeIconColor : inactiveIconColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useEyeComfort } from "../../hooks/useEyeComfort";
import { getEyeComfortOverlayColor } from "../../utils/eyeComfortColors";

export function EyeComfortOverlay() {
  const { isDark } = useTheme();
  const { isEnabled, level, customIntensity } = useEyeComfort();

  if (!isEnabled) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      testID="eye-comfort-overlay"
      style={[
        styles.overlay,
        {
          backgroundColor: getEyeComfortOverlayColor({
            isDark,
            level,
            customIntensity,
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});

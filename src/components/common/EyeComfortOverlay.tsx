import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReadingDisplayStore } from "../../stores/readingDisplayStore";
import { getEyeComfortOverlayColorFromIntensity } from "../../utils/eyeComfortColors";

export function EyeComfortOverlay() {
  const { isDark } = useTheme();
  const isEnabled = useReadingDisplayStore(
    (state) => state.eyeComfortEnabled,
  );
  const intensity = useReadingDisplayStore(
    (state) => state.eyeComfortIntensity,
  );

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
          backgroundColor: getEyeComfortOverlayColorFromIntensity({
            isDark,
            intensity,
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

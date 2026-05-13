import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReadingDisplayStore } from "../../stores/readingDisplayStore";
import { getEyeComfortOverlayColorFromIntensity } from "../../utils/eyeComfortColors";

export function EyeComfortImageOverlay() {
  const { isDark } = useTheme();
  const isEnabled = useReadingDisplayStore(
    (state) => state.eyeComfortEnabled,
  );
  const scope = useReadingDisplayStore((state) => state.eyeComfortScope);
  const intensity = useReadingDisplayStore(
    (state) => state.eyeComfortIntensity,
  );

  if (!isEnabled || scope !== "images") {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      testID="eye-comfort-image-overlay"
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
  },
});

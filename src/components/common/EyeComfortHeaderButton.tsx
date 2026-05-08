import { FontSizes } from "@/constants/fontSizes";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useReadingDisplayStore } from "../../stores/readingDisplayStore";

interface EyeComfortHeaderButtonProps {
  testID?: string;
}

export function EyeComfortHeaderButton({
  testID = "eye-comfort-header-button",
}: EyeComfortHeaderButtonProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const openDisplayModal = useReadingDisplayStore(
    (state) => state.openDisplayModal,
  );
  const label = t("readingDisplay.headerButtonLabel", {
    defaultValue: "Reading display settings",
  });
  const textColor = isDark ? "#f2f2f7" : "#1f2937";

  return (
    <Pressable
      testID={testID}
      onPress={openDisplayModal}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.button}
    >
      <Text style={[styles.text, { color: textColor }]}>Aa</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "700",
  },
});

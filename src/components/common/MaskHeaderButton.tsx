import { FontSizes } from "@/constants/fontSizes";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useWordBankMaskStore } from "../../stores/wordBankMaskStore";

interface MaskHeaderButtonProps {
  hidden?: boolean;
  testID?: string;
}

export function MaskHeaderButton({
  hidden = false,
  testID = "courses-mask-header-button",
}: MaskHeaderButtonProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const isMaskEnabled = useWordBankMaskStore((state) => state.isMaskEnabled);
  const toggleMask = useWordBankMaskStore((state) => state.toggleMask);
  const textColor = isDark ? "#f2f2f7" : "#1f2937";
  const label = isMaskEnabled
    ? t("course.show", { defaultValue: "Show" })
    : t("course.mask", { defaultValue: "Mask" });

  if (hidden) {
    return null;
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={toggleMask}
      style={styles.button}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
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
    fontSize: FontSizes.bodyMd,
    fontWeight: "700",
  },
});

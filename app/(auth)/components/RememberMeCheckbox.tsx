/**
 * =============================================================================
 * REMEMBER ME CHECKBOX COMPONENT
 * =============================================================================
 * Checkbox for "Remember Me" functionality
 * - Custom checkbox with checkmark icon
 * - Theme-aware styling (dark/light mode)
 * - Blue accent when checked
 * =============================================================================
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface RememberMeCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  checked,
  onToggle,
  label,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: fontColors.iconMuted,
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: bg.accent,
      borderColor: bg.accent,
    },
    label: {
      color: fontColors.supporting,
      fontSize: FontSizes.body,
    },
  });
};

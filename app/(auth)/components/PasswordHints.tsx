/**
 * =============================================================================
 * PASSWORD HINTS COMPONENT
 * =============================================================================
 * Displays real-time password validation requirements
 * - Shows 4 validation rules with checkmark icons
 * - Green checkmark when requirement is met
 * - Gray outline when requirement is not met
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface PasswordHintsProps {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passwordsMatch: boolean;
  hints: {
    length: string;
    number: string;
    special: string;
    match: string;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================
export const PasswordHints: React.FC<PasswordHintsProps> = ({
  hasMinLength,
  hasNumber,
  hasSpecial,
  passwordsMatch,
  hints,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);

  const requirements = [
    { met: hasMinLength, text: hints.length },
    { met: hasNumber, text: hints.number },
    { met: hasSpecial, text: hints.special },
    { met: passwordsMatch, text: hints.match },
  ];

  return (
    <View style={styles.hintsContainer}>
      {requirements.map((req, index) => (
        <View key={index} style={styles.hintRow}>
          <Ionicons
            name={req.met ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={req.met ? fontColors.success : fontColors.supporting}
          />
          <Text style={[styles.hintText, req.met && styles.hintTextValid]}>
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    hintsContainer: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    hintText: {
      marginLeft: 8,
      color: fontColors.supporting,
      fontSize: FontSizes.caption,
    },
    hintTextValid: {
      color: fontColors.success,
    },
  });
};

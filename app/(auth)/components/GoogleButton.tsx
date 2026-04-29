import { FontWeights } from "@/constants/fontWeights";
/**
 * =============================================================================
 * GOOGLE BUTTON COMPONENT
 * =============================================================================
 * Google OAuth sign-in button
 * - Displays Google logo icon
 * - Outlined style with theme-aware colors
 * - Disabled state with reduced opacity
 * - Changes text during loading
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface GoogleButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  loadingTitle?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const GoogleButton: React.FC<GoogleButtonProps> = ({
  title,
  onPress,
  loading = false,
  loadingTitle,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity
      style={[styles.googleButton, (loading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Ionicons
        name="logo-google"
        size={20}
        color="#DB4437"
        style={styles.googleIcon}
      />
      <Text style={styles.googleButtonText}>
        {loading && loadingTitle ? loadingTitle : title}
      </Text>
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
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg.card,
      borderWidth: 1,
      borderColor: fontColors.inputBorder,
      paddingVertical: 16,
      borderRadius: 12,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    googleIcon: {
      marginRight: 12,
    },
    googleButtonText: {
      color: fontColors.body,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.semiBold,
    },
  });
};

import { FontWeights } from "@/constants/fontWeights";
/**
 * =============================================================================
 * ERROR BANNER COMPONENT
 * =============================================================================
 * Displays validation and Firebase errors at the top of forms
 * - Shows alert icon with error message
 * - Optional title for error categorization
 * - Optional close button for dismissible errors
 * - Theme-aware styling (dark/light mode)
 * - Conditionally rendered based on error message
 * =============================================================================
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface ErrorBannerProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onClose,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);

  if (!message) return null;

  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons
        name="alert-circle"
        size={18}
        color={fontColors.iconError}
        style={styles.errorIcon}
      />
      <View style={styles.errorTextContainer}>
        {title && <Text style={styles.errorTitle}>{title}</Text>}
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Close"
        >
          <Ionicons
            name="close"
            size={18}
            color={fontColors.iconError}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: bg.accentRedDeep,
      borderColor: fontColors.errorBannerBorder,
    },
    errorIcon: {
      marginRight: 10,
    },
    errorTextContainer: {
      flex: 1,
    },
    errorTitle: {
      fontSize: FontSizes.body,
      fontWeight: FontWeights.bold,
      color: fontColors.authErrorTitle,
      marginBottom: 2,
    },
    errorMessage: {
      fontSize: FontSizes.label,
      color: fontColors.authErrorMessage,
    },
  });
};

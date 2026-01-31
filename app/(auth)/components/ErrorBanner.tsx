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
import { useTheme } from "../../../src/context/ThemeContext";

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

  if (!message) return null;

  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons
        name="alert-circle"
        size={18}
        color={isDark ? "#FF8A8A" : "#D93025"}
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
            color={isDark ? "#FF8A8A" : "#D93025"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: isDark ? "#2A1414" : "#FFF1F1",
      borderColor: isDark ? "#5C1F1F" : "#F5B5B5",
    },
    errorIcon: {
      marginRight: 10,
    },
    errorTextContainer: {
      flex: 1,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFB3B3" : "#D93025",
      marginBottom: 2,
    },
    errorMessage: {
      fontSize: 13,
      color: isDark ? "#FFD5D5" : "#8A1C1C",
    },
  });

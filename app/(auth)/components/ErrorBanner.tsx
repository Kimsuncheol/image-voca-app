/**
 * =============================================================================
 * ERROR BANNER COMPONENT
 * =============================================================================
 * Displays validation and Firebase errors at the top of forms
 * - Shows alert icon with error message
 * - Theme-aware styling (dark/light mode)
 * - Conditionally rendered based on error message
 * =============================================================================
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface ErrorBannerProps {
  message: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  if (!message) return null;

  return (
    <View style={styles.errorBanner}>
      <Ionicons
        name="alert-circle"
        size={20}
        color="#DC3545"
        style={styles.errorIcon}
      />
      <Text style={styles.errorBannerText}>{message}</Text>
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
      backgroundColor: isDark ? "#2C1618" : "#FEE",
      borderWidth: 1,
      borderColor: isDark ? "#5C2B2E" : "#FCC",
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    errorIcon: {
      marginRight: 8,
    },
    errorBannerText: {
      flex: 1,
      color: isDark ? "#FF6B6B" : "#DC3545",
      fontSize: 14,
      lineHeight: 20,
    },
  });

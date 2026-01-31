/**
 * =============================================================================
 * DIVIDER COMPONENT
 * =============================================================================
 * Visual separator with centered text (typically "OR")
 * - Displays horizontal lines on either side of text
 * - Theme-aware styling (dark/light mode)
 * - Commonly used to separate authentication methods
 * =============================================================================
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface DividerProps {
  text: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const Divider: React.FC<DividerProps> = ({ text }) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.dividerContainer}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.divider} />
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#333" : "#E0E0E0",
    },
    dividerText: {
      marginHorizontal: 16,
      color: isDark ? "#888" : "#999",
      fontWeight: "600",
    },
  });

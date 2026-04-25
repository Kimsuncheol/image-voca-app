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
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";

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
const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: bg.subtleGray,
    },
    dividerText: {
      marginHorizontal: 16,
      color: fontColors.tertiary,
      fontWeight: "600",
    },
  });
};

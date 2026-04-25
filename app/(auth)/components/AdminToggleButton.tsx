/**
 * =============================================================================
 * ADMIN TOGGLE BUTTON COMPONENT
 * =============================================================================
 * Toggle button for requesting admin privileges during registration
 * - Development/Testing feature
 * - Shows active/inactive visual states
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface AdminToggleButtonProps {
  requestAdmin: boolean;
  onToggle: () => void;
  activeText?: string;
  inactiveText?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const AdminToggleButton: React.FC<AdminToggleButtonProps> = ({
  requestAdmin,
  onToggle,
  activeText = "✓ Register as Admin",
  inactiveText = "Register as Admin",
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.adminToggleButton,
        requestAdmin && styles.adminToggleButtonActive,
      ]}
      onPress={onToggle}
    >
      <Text
        style={[
          styles.adminToggleText,
          requestAdmin && styles.adminToggleTextActive,
        ]}
      >
        {requestAdmin ? activeText : inactiveText}
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
    adminToggleButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: fontColors.inputBorder,
      backgroundColor: bg.cardElevated,
      alignItems: "center",
      marginBottom: 16,
    },
    adminToggleButtonActive: {
      borderColor: "#007AFF",
      backgroundColor: bg.accentBlueSoft,
    },
    adminToggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: fontColors.mutedLabel,
    },
    adminToggleTextActive: {
      color: fontColors.actionAccent,
    },
  });
};

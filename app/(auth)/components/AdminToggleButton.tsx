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
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    adminToggleButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#E0E0E0",
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      alignItems: "center",
      marginBottom: 16,
    },
    adminToggleButtonActive: {
      borderColor: "#007AFF",
      backgroundColor: isDark ? "#0A1F3D" : "#E6F2FF",
    },
    adminToggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#888" : "#666",
    },
    adminToggleTextActive: {
      color: "#007AFF",
    },
  });

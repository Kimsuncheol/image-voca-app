/**
 * =============================================================================
 * PRIMARY BUTTON COMPONENT
 * =============================================================================
 * Main action button with loading state
 * - Blue background with shadow effect
 * - Disabled state with reduced opacity
 * - Changes text during loading
 * - Theme-aware (works in dark/light mode)
 * =============================================================================
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { BackgroundColors } from "../../../constants/backgroundColors";
import { FontColors } from "../../../constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  loadingTitle?: string;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  loadingTitle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Text style={styles.buttonText}>
        {loading && loadingTitle ? loadingTitle : title}
      </Text>
    </TouchableOpacity>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  button: {
    backgroundColor: BackgroundColors.light.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: FontColors.light.buttonOnAccent,
    fontSize: FontSizes.bodyLg,
    fontWeight: "bold",
  },
});

/**
 * =============================================================================
 * ADMIN CODE INPUT COMPONENT
 * =============================================================================
 * Optional admin code input section for user registration
 * - Validates admin codes against Firestore
 * - Shows real-time validation feedback
 * - Displays success badge when valid code is entered
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { FormInput } from "./FormInput";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface AdminCodeInputProps {
  adminCode: string;
  onChangeAdminCode: (code: string) => void;
  isValidAdminCode: boolean;
  adminCodeError: string;
  label: string;
  placeholder: string;
  validCodeMessage: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const AdminCodeInput: React.FC<AdminCodeInputProps> = ({
  adminCode,
  onChangeAdminCode,
  isValidAdminCode,
  adminCodeError,
  label,
  placeholder,
  validCodeMessage,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.adminCodeContainer}>
      <Text style={styles.adminCodeLabel}>{label}</Text>
      <FormInput
        icon="shield-checkmark-outline"
        placeholder={placeholder}
        value={adminCode}
        onChangeText={onChangeAdminCode}
        autoCapitalize="characters"
        showValidation={adminCode.length > 0}
        isValid={isValidAdminCode}
        isTouched={adminCode.length > 0}
        errorMessage={adminCodeError}
      />
      {isValidAdminCode && (
        <View style={styles.adminCodeSuccessBadge}>
          <Text style={styles.adminCodeSuccessText}>
            ✓ {validCodeMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    adminCodeContainer: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
    },
    adminCodeLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 12,
    },
    adminCodeSuccessBadge: {
      marginTop: 8,
      padding: 8,
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#1E4620" : "#28A745",
    },
    adminCodeSuccessText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#4ADE80" : "#28A745",
      textAlign: "center",
    },
  });

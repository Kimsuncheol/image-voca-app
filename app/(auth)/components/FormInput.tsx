/**
 * =============================================================================
 * FORM INPUT COMPONENT
 * =============================================================================
 * Reusable text input field with icon and validation states
 * - Supports left icon
 * - Optional right icon for validation feedback
 * - Error and success visual states
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface FormInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  errorMessage?: string;
  showValidation?: boolean;
  isValid?: boolean;
  isTouched?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const FormInput: React.FC<FormInputProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  errorMessage,
  showValidation = false,
  isValid = false,
  isTouched = false,
  ...rest
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View>
      <View
        style={[
          styles.inputContainer,
          isTouched && !isValid && value && styles.inputError,
          isTouched && isValid && styles.inputSuccess,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isDark ? "#ccc" : "#666"}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={isDark ? "#666" : "#999"}
          {...rest}
        />
        {showValidation && isTouched && value && (
          <Ionicons
            name={isValid ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={isValid ? "#28A745" : "#DC3545"}
          />
        )}
      </View>
      {errorMessage && isTouched && !isValid && value && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
    },
    inputError: {
      borderColor: isDark ? "#5C2B2E" : "#DC3545",
      backgroundColor: isDark ? "#2C1618" : "#FFF5F5",
    },
    inputSuccess: {
      borderColor: isDark ? "#1E4620" : "#28A745",
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#fff" : "#333",
    },
    errorText: {
      color: isDark ? "#FF6B6B" : "#DC3545",
      fontSize: 12,
      marginTop: -12,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
  });

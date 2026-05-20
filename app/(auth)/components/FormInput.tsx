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
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getBorderColors } from "../../../constants/borderColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { FontSizes } from "@/constants/fontSizes";

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
  clearable?: boolean;
  onClear?: () => void;
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
  clearable = false,
  onClear,
  ...rest
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);

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
          color={fontColors.supporting}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={fontColors.placeholder}
          {...rest}
        />
        <View style={styles.trailingActions}>
          {showValidation && isTouched && value && (
            <Ionicons
              name={isValid ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={isValid ? "#28A745" : "#DC3545"}
            />
          )}
          {clearable && value && onClear && (
            <TouchableOpacity
              accessibilityLabel={`Clear ${placeholder}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClear}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={fontColors.supporting}
              />
            </TouchableOpacity>
          )}
        </View>
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
const getStyles = (isDark: boolean) => {
  const borderColors = getBorderColors(isDark);
  const fontColors = getFontColors(isDark);
  const bg = getBackgroundColors(isDark);

  return StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: borderColors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 16,
      backgroundColor: bg.cardElevated,
    },
    inputError: {
      borderColor: borderColors.inputBorderError,
      backgroundColor: bg.accentRedSoft,
    },
    inputSuccess: {
      borderColor: borderColors.inputBorderSuccess,
      backgroundColor: bg.successSoft,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: FontSizes.bodyLg,
      color: fontColors.body,
    },
    trailingActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    clearButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: fontColors.error,
      fontSize: FontSizes.caption,
      marginTop: -12,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
  });
};

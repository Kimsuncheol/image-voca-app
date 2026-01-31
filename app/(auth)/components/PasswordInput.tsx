/**
 * =============================================================================
 * PASSWORD INPUT COMPONENT
 * =============================================================================
 * Password input field with visibility toggle
 * - Lock icon on the left
 * - Eye icon button to toggle password visibility
 * - Secure text entry
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface PasswordInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const PasswordInput: React.FC<PasswordInputProps> = ({
  placeholder,
  value,
  onChangeText,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Ionicons
        name="lock-closed-outline"
        size={20}
        color={isDark ? "#ccc" : "#666"}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        placeholderTextColor={isDark ? "#666" : "#999"}
      />
      <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
        <Ionicons
          name={isVisible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={isDark ? "#ccc" : "#666"}
        />
      </TouchableOpacity>
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
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#fff" : "#333",
    },
  });

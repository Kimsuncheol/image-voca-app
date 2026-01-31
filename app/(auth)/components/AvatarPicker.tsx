/**
 * =============================================================================
 * AVATAR PICKER COMPONENT
 * =============================================================================
 * Allows user to select profile picture from device gallery
 * - Shows camera icon placeholder when no image selected
 * - Displays selected image in circular frame
 * - Handles permission requests
 * - Shows inline error if permission is denied
 * - Theme-aware styling (dark/light mode)
 * =============================================================================
 */

import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface AvatarPickerProps {
  avatarUri: string | null;
  onPress: () => void;
  label: string;
  errorMessage?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  avatarUri,
  onPress,
  label,
  errorMessage,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.avatarContainer}>
      <TouchableOpacity onPress={onPress} style={styles.avatarButton}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="camera-outline"
              size={32}
              color={isDark ? "#666" : "#999"}
            />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.avatarLabel}>{label}</Text>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    avatarContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    avatarButton: {
      marginBottom: 8,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#007AFF",
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarLabel: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
    },
    errorText: {
      color: isDark ? "#FF6B6B" : "#DC3545",
      fontSize: 12,
      marginTop: 4,
      paddingHorizontal: 4,
    },
  });

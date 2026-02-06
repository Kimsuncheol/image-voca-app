import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UploadModalPrimaryActionProps {
  isDark: boolean;
  label: string;
  actionColor: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}

export default function UploadModalPrimaryAction({
  isDark,
  label,
  actionColor,
  onPress,
  loading,
  disabled,
}: UploadModalPrimaryActionProps) {
  const styles = getStyles(isDark);
  const isDisabled = loading || disabled;

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: actionColor },
          isDisabled && styles.primaryButtonDisabled,
        ]}
        onPress={onPress}
        disabled={isDisabled}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#38383a" : "#e5e5ea",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    primaryButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

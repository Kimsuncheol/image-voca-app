import React from "react";
import { StyleSheet, View } from "react-native";
import UploadActionButton from "./UploadActionButton";

interface UploadFooterProps {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  text: string;
  iconName: any; // Ionicons name type
  backgroundColor?: string;
  isDark: boolean;
}

export default function UploadFooter({
  onPress,
  loading,
  disabled,
  text,
  iconName,
  backgroundColor,
  isDark,
}: UploadFooterProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <UploadActionButton
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        text={text}
        iconName={iconName}
        backgroundColor={backgroundColor}
      />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      justifyContent: "center",
      backgroundColor: isDark ? "#000" : "#f2f2f7",
      padding: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#c6c6c8",
    },
  });

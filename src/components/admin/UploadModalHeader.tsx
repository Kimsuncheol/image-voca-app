import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UploadModalHeaderProps {
  isDark: boolean;
  title: string;
  onClose: () => void;
  loading: boolean;
}

export default function UploadModalHeader({
  isDark,
  title,
  onClose,
  loading,
}: UploadModalHeaderProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        disabled={loading}
      >
        <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    placeholder: {
      width: 32,
    },
  });

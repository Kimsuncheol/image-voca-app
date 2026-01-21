import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UploadItemHeaderProps {
  index: number;
  showDelete: boolean;
  onDelete: () => void;
  titlePrefix: string;
  isDark: boolean;
}

export default function UploadItemHeader({
  index,
  showDelete,
  onDelete,
  titlePrefix,
  isDark,
}: UploadItemHeaderProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.headerRow}>
      <Text style={styles.itemTitle}>
        {titlePrefix} #{index + 1}
      </Text>
      {showDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#FF3B30" // System Red
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
    },
  });

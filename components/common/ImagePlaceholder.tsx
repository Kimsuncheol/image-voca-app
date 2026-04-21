import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface ImagePlaceholderProps {
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ImagePlaceholder({ isDark, style }: ImagePlaceholderProps) {
  return (
    <View style={[styles.imagePlaceholder, style]}>
      <Ionicons
        name="image-outline"
        size={48}
        color={isDark ? "#555" : "#ccc"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    backgroundColor: "#9f9f9f",
    justifyContent: "center",
    alignItems: "center",
  },
});

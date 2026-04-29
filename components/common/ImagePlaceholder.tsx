import { getBackgroundColors } from "@/constants/backgroundColors";
import { getFontColors } from "@/constants/fontColors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface ImagePlaceholderProps {
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ImagePlaceholder({ isDark, style }: ImagePlaceholderProps) {
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return (
    <View
      style={[
        styles.imagePlaceholder,
        { backgroundColor: bgColors.learningCardImage },
        style,
      ]}
    >
      <Ionicons
        name="image-outline"
        size={48}
        color={fontColors.learningCardFaint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
});

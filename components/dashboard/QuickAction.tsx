import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { IconSymbol, IconSymbolName } from "../ui/icon-symbol";

interface QuickActionProps {
  title: string;
  icon: IconSymbolName;
  color?: string;
  onPress: () => void;
}

export function QuickAction({ title, icon, color, onPress }: QuickActionProps) {
  const { isDark } = useTheme();
  const iconColor = color || Colors[isDark ? "dark" : "light"].tint;

  return (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
        <IconSymbol name={icon} size={22} color={iconColor} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    width: 72,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    textAlign: "center",
  },
});

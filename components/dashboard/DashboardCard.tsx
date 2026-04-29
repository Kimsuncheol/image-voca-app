import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/theme";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { IconSymbol, IconSymbolName } from "../ui/icon-symbol";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: IconSymbolName;
  color?: string;
  onPress?: () => void;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
}: DashboardCardProps) {
  const { isDark } = useTheme();
  const iconColor = color || Colors[isDark ? "dark" : "light"].tint;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
        <IconSymbol name={icon} size={24} color={iconColor} />
      </View>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText type="title" style={styles.value}>
        {value}
      </ThemedText>
      {subtitle && (
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minWidth: "45%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: FontSizes.body,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: FontSizes.headingLg,
    lineHeight: LineHeights.headingXxl,
  },
  subtitle: {
    fontSize: FontSizes.caption,
    opacity: 0.5,
    marginTop: 4,
  },
});

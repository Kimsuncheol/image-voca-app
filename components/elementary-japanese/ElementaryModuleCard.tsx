import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

export type ElementaryModuleCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDark: boolean;
};

export function ElementaryModuleCard({
  title,
  description,
  icon,
  onPress,
  isDark,
}: ElementaryModuleCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconShell,
            { backgroundColor: isDark ? "#2c2c2e" : "#ffffff" },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={isDark ? "#fff" : "#111827"}
          />
        </View>
        <View style={styles.textGroup}>
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          <ThemedText style={styles.cardDescription}>{description}</ThemedText>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  iconShell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
  },
  cardDescription: {
    fontSize: FontSizes.label,
    lineHeight: LineHeights.bodyLg,
    opacity: 0.65,
  },
});

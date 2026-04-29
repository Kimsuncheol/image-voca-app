import { FontColors } from "@/constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";

interface DayBadgeProps {
  day: number;
}

export function DayBadge({ day }: DayBadgeProps) {
  return <ThemedText style={styles.badge}>Day {day}</ThemedText>;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: FontSizes.label,
    color: FontColors.dark.dayBadge,
    fontWeight: FontWeights.semiBold,
    opacity: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
});

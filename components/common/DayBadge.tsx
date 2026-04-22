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
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
});

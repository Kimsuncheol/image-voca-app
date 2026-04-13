import React from "react";
import { StyleSheet, Text } from "react-native";

interface DayBadgeProps {
  day: number;
  isDark: boolean;
}

export function DayBadge({ day, isDark }: DayBadgeProps) {
  return (
    <Text style={[styles.badge, isDark && styles.badgeDark]}>Day {day}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    color: "#007AFF",
    alignSelf: "flex-start",
    marginTop: 6,
  },
  badgeDark: {
    backgroundColor: "rgba(10, 132, 255, 0.2)",
    color: "#0a84ff",
  },
});

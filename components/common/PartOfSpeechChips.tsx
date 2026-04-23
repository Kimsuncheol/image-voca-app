import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface PartOfSpeechChipsProps {
  labels: string[];
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PartOfSpeechChips({
  labels,
  isDark,
  style,
}: PartOfSpeechChipsProps) {
  if (labels.length === 0) {
    return null;
  }

  const chipColor = isDark ? "#D1D5DB" : "#4B5563";

  return (
    <View style={[styles.container, style]}>
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.chip}>
          <Text style={[styles.label, { color: chipColor }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
    textTransform: "lowercase",
  },
});

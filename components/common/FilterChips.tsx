import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

export interface FilterChipOption {
  id: string;
  label: string;
  count?: number; // Optional count to show in badge (future use)
}

interface FilterChipsProps {
  options: FilterChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

/**
 * FilterChips Component
 *
 * Displays a horizontal scrollable list of filter chips.
 * Supports single selection.
 */
export function FilterChips({
  options,
  selectedId,
  onSelect,
  style,
}: FilterChipsProps) {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          const bg = isSelected
            ? isDark
              ? "#fff"
              : "#000"
            : isDark
              ? "#1c1c1e"
              : "#f5f5f5";
          const text = isSelected
            ? isDark
              ? "#000"
              : "#fff"
            : isDark
              ? "#fff"
              : "#000";

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.chip,
                { backgroundColor: bg },
                !isSelected && isDark && styles.chipBorderDark,
                !isSelected && !isDark && styles.chipBorderLight,
              ]}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.label,
                  { color: text, fontWeight: isSelected ? "600" : "400" },
                ]}
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  chipBorderDark: {
    borderWidth: 1,
    borderColor: "#333",
  },
  chipBorderLight: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  label: {
    fontSize: 14,
  },
});

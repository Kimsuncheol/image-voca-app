import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

interface TargetScorePickerProps {
  value: number;
  options: number[];
  isDark: boolean;
  onChange: (value: number) => void;
}

export function TargetScorePicker({
  value,
  options,
  isDark,
  onChange,
}: TargetScorePickerProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
          borderColor: isDark ? "#3a3a3c" : "#e1e1e6",
        },
      ]}
    >
      <Picker
        selectedValue={value}
        onValueChange={(itemValue) => onChange(Number(itemValue))}
        dropdownIconColor={isDark ? "#fff" : "#000"}
        style={[
          styles.picker,
          {
            color: isDark ? "#fff" : "#000",
            backgroundColor: isDark ? "grey" : "#f2f2f7",
          },
        ]}
        itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
        mode="dialog"
      >
        {options.map((option) => (
          <Picker.Item
            key={`target-score-${option}`}
            label={String(option)}
            value={option}
            style={[
              styles.pickerItem,
              {
                color: isDark ? "#fff" : "#000",
                backgroundColor: isDark ? "grey" : "#f2f2f7",
              },
            ]}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 90,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
  },
});

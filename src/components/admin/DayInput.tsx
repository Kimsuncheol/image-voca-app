import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface DayInputProps {
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
  isDark: boolean;
}

export default function DayInput({
  value,
  onChangeText,
  editable = true,
  isDark,
}: DayInputProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Subcollection Name</Text>
      <View style={styles.dayInputContainer}>
        <View style={styles.dayPrefix}>
          <Text style={styles.dayPrefixText}>Day</Text>
        </View>
        <TextInput
          style={styles.dayInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="1"
          placeholderTextColor={isDark ? "#555" : "#999"}
          keyboardType="numeric"
          editable={editable}
        />
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
      color: isDark ? "#8e8e93" : "#6e6e73",
      textTransform: "uppercase",
      marginLeft: 2,
    },
    dayInputContainer: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    dayPrefix: {
      backgroundColor: "#0b51e6",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    dayPrefixText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    dayInput: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
      borderLeftWidth: 0,
    },
  });

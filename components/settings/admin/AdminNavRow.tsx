import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AdminNavRowProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  isDark: boolean;
  styles: any;
  showSeparator?: boolean;
}

export const AdminNavRow: React.FC<AdminNavRowProps> = ({
  title,
  icon,
  onPress,
  isDark,
  styles,
  showSeparator = true,
}) => {
  const chevronColor = isDark ? "#8e8e93" : "#c7c7cc";

  return (
    <>
      <TouchableOpacity style={styles.option} onPress={onPress}>
        <View style={styles.optionLeft}>
          <Ionicons name={icon} size={22} color={isDark ? "#fff" : "#000"} />
          <Text style={styles.optionText}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={chevronColor} />
      </TouchableOpacity>
      {showSeparator && <View style={styles.separator} />}
    </>
  );
};

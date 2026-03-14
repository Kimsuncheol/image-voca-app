import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../src/context/ThemeContext";

export default function ComingSoonScreen() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f2f2f7" },
      ]}
    >
      <Stack.Screen
        options={{
          title: "Japanese",
          headerStyle: { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
          headerTitleStyle: { color: isDark ? "#fff" : "#000" },
          headerTintColor: "#007AFF",
        }}
      />
      <Ionicons
        name="time-outline"
        size={72}
        color={isDark ? "#555" : "#c7c7cc"}
      />
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        Coming Soon
      </Text>
      <Text
        style={[
          styles.description,
          { color: isDark ? "#8e8e93" : "#6e6e73" },
        ]}
      >
        Japanese learning content is currently under development. Stay tuned for
        updates!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

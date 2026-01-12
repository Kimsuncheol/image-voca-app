import React from "react";
import { StyleSheet } from "react-native";
import { HelloWave } from "../hello-wave";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

export function WelcomeSection() {
  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedText type="title">Welcome!</ThemedText>
      <HelloWave />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

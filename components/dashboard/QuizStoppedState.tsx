/**
 * ====================================
 * QUIZ STOPPED STATE COMPONENT
 * ====================================
 *
 * Displays when quiz is paused due to 3 wrong answers.
 * Shows restart button to continue.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface QuizStoppedStateProps {
  title: string;
  subtitle: string;
  buttonText: string;
  isDark: boolean;
  onRestart: () => void;
}

export function QuizStoppedState({
  title,
  subtitle,
  buttonText,
  isDark,
  onRestart,
}: QuizStoppedStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="alert-circle"
        size={48}
        color={isDark ? "#ff6b6b" : "#dc3545"}
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      <TouchableOpacity
        style={styles.button}
        onPress={onRestart}
        activeOpacity={0.8}
      >
        <Ionicons name="play" size={20} color="#fff" />
        <ThemedText style={styles.buttonText}>{buttonText}</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

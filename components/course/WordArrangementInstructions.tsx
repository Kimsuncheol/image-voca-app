import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";

interface WordArrangementInstructionsProps {
  text: string;
}

export function WordArrangementInstructions({
  text,
}: WordArrangementInstructionsProps) {
  return <ThemedText style={styles.hint}>{text}</ThemedText>;
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});

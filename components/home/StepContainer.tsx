import React from "react";
import { StyleSheet, ViewProps } from "react-native";
import { ThemedView } from "../themed-view";

interface StepContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function StepContainer({
  children,
  style,
  ...props
}: StepContainerProps) {
  return (
    <ThemedView style={[styles.stepContainer, style]} {...props}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});

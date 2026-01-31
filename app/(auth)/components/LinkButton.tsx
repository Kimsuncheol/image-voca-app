/**
 * =============================================================================
 * LINK BUTTON COMPONENT
 * =============================================================================
 * Clickable text link button
 * - Used for actions like "Forgot Password?"
 * - Blue text with semi-bold weight
 * - No background or border
 * =============================================================================
 */

import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface LinkButtonProps {
  text: string;
  onPress: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const LinkButton: React.FC<LinkButtonProps> = ({ text, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  text: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface RoleplayDialogueRowProps {
  role: string;
  text: React.ReactNode;
  contentStyle?: object;
}

export const RoleplayDialogueRow = React.memo(function RoleplayDialogueRow({
  role,
  text,
  contentStyle,
}: RoleplayDialogueRowProps) {
  return (
    <View style={styles.dialogueRow}>
      <View style={[styles.roleBadge]}>
        <ThemedText style={styles.roleText}>{role}</ThemedText>
      </View>
      <View style={{ flex: 1 }}>{text}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  dialogueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },
  roleBadge: {
    paddingHorizontal: 12,
  },
  roleText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semiBold,
    opacity: 0.8,
  },
});

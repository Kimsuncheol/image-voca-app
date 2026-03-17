import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface NotificationHeaderProps {
  /** Dynamic title derived from the card kind ("Word Notification" / "Collocation Notification") */
  title: string;
  backLabel?: string;
  isDark: boolean;
  onBack: () => void;
}

/**
 * Header bar for the notification card screen.
 * Shows a back-to-dashboard pill button on the left and the card kind title below it.
 */
export default function NotificationHeader({
  title,
  backLabel = "Dashboard",
  isDark,
  onBack,
}: NotificationHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={isDark ? "#FFFFFF" : "#111827"}
        />
        <Text
          style={[
            styles.backButtonText,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          {backLabel}
        </Text>
      </Pressable>

      <Text
        style={[styles.headerTitle, { color: isDark ? "#E5E7EB" : "#374151" }]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginLeft: 4,
  },
});

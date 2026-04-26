import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

interface QuizHeaderProps {
  title: string;
  isDark: boolean;
  onQuit?: () => void;
}

export function QuizHeader({ title, isDark, onQuit }: QuizHeaderProps) {
  return (
    <View style={styles.container}>
      {onQuit ? (
        <TouchableOpacity
          onPress={onQuit}
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSpacer} />
      )}
      <ThemedText style={styles.title} type="defaultSemiBold">
        {title}
      </ThemedText>
      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: FontSizes.title,
    flex: 1,
    textAlign: "center",
  },
  rightSpacer: {
    width: 44, // Matches the approximate width and padding of the back button to keep title perfectly centered
  },
});

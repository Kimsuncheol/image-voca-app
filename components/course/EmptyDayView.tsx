import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

export function EmptyDayView() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" },
        ]}
      >
        <Ionicons
          name="book-outline"
          size={32}
          color={isDark ? "#636366" : "#AEAEB2"}
        />
      </View>
      <ThemedText style={styles.emptyStateText}>
        {t("course.noDaysAvailable", { defaultValue: "No days available yet" })}
      </ThemedText>
      
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={isDark ? "#FFFFFF" : "#000000"} />
        <ThemedText style={styles.backButtonText}>
          {t("common.back", { defaultValue: "Go Back" })}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.5,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

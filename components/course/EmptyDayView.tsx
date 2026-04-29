import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";

export function EmptyDayView() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : "rgba(0, 122, 255, 0.1)" },
        ]}
      >
        <Ionicons
          name="book"
          size={36}
          color={isDark ? "#0A84FF" : "#007AFF"}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: FontSizes.title,
    fontWeight: FontWeights.semiBold,
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
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
  },
});

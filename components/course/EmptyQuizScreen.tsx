import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

export function EmptyQuizScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIconContainer,
          {
            backgroundColor: isDark
              ? "rgba(255, 214, 10, 0.16)"
              : "rgba(255, 204, 0, 0.14)",
          },
        ]}
      >
        <Ionicons
          name="help-circle"
          size={38}
          color={isDark ? "#FFD60A" : "#B7791F"}
        />
      </View>
      <ThemedText style={styles.emptyStateText}>
        {t("quiz.empty.title", { defaultValue: "No quiz available yet" })}
      </ThemedText>
      <ThemedText style={styles.emptyStateDescription}>
        {t("quiz.empty.description", {
          defaultValue: "Please try another day or quiz type.",
        })}
      </ThemedText>

      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" },
        ]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={isDark ? "#FFFFFF" : "#000000"}
        />
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
    paddingHorizontal: 24,
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
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginTop: 8,
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

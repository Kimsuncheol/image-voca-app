import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface EmptyWordBankViewProps {
  courseId: string;
  courseColor?: string;
  isDark: boolean;
}

/**
 * Empty Word Bank View Component
 *
 * Displays when the user has no saved words for this course
 * Shows an icon, message, and call-to-action button to start learning
 */
export function EmptyWordBankView({
  courseId,
  courseColor,
  isDark,
}: EmptyWordBankViewProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      {/* Icon */}
      <Ionicons
        name="book-outline"
        size={64}
        color={isDark ? "#444" : "#ccc"}
      />

      {/* Title */}
      <ThemedText style={styles.emptyText}>
        {t("wordBank.empty.title")}
      </ThemedText>

      {/* Subtitle */}
      <ThemedText style={styles.emptySubtext}>
        {t("wordBank.empty.subtitle")}
      </ThemedText>

      {/* Call-to-action button */}
      <Pressable
        style={[
          styles.startButton,
          { backgroundColor: courseColor || "#007AFF" },
        ]}
        onPress={() =>
          router.push({
            pathname: "/course/[courseId]/days",
            params: { courseId },
          })
        }
      >
        <ThemedText style={styles.startButtonText}>
          {t("course.startLearning", { defaultValue: "Start Learning" })}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  startButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

interface VocabularyEmptyStateProps {
  isDark: boolean;
}

export const VocabularyEmptyState: React.FC<VocabularyEmptyStateProps> = ({
  isDark,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons
        name="book-outline"
        size={48}
        color={isDark ? "#4B5563" : "#9CA3AF"}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: isDark ? "#F3F4F6" : "#111827" }]}>
        No words found
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        No words found for this day.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons
          name="arrow-back-outline"
          size={18}
          color={isDark ? "#D1D5DB" : "#374151"}
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonText, { color: isDark ? "#D1D5DB" : "#374151" }]}>
          {t("common.back")}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.body,
    textAlign: "center",
    lineHeight: LineHeights.title,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: FontSizes.bodyMd,
    fontWeight: "500",
  },
});

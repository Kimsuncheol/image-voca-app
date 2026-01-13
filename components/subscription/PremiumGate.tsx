import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { useSubscriptionStore } from "../../src/stores";
import { ThemedText } from "../themed-text";

interface PremiumGateProps {
  feature: "unlimited_voca" | "speaking";
  children: React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const { canAccessUnlimitedVoca, canAccessSpeaking } = useSubscriptionStore();
  const { t } = useTranslation();

  const hasAccess =
    feature === "unlimited_voca" ? canAccessUnlimitedVoca() : canAccessSpeaking();

  if (hasAccess) {
    return <>{children}</>;
  }

  const featureInfo = {
    unlimited_voca: {
      title: t("subscription.unlimited.title"),
      description: t("subscription.unlimited.description"),
      icon: "book",
    },
    speaking: {
      title: t("subscription.speaking.title"),
      description: t("subscription.speaking.description"),
      icon: "mic",
    },
  };

  const info = featureInfo[feature];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={48} color={isDark ? "#666" : "#999"} />
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {info.title}
      </ThemedText>
      <ThemedText style={styles.description}>{info.description}</ThemedText>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => router.push("/billing")}
      >
        <Ionicons name="arrow-up-circle" size={20} color="#fff" />
        <ThemedText style={styles.upgradeButtonText}>
          {t("common.upgrade")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    margin: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

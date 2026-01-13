import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { PLANS, useSubscriptionStore } from "../../src/stores";
import { ThemedText } from "../themed-text";

export function SubscriptionBadge() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { currentPlan } = useSubscriptionStore();
  const { t } = useTranslation();

  const plan = PLANS.find((p) => p.id === currentPlan);
  const isFree = currentPlan === "free";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        !isFree && styles.premiumContainer,
      ]}
      onPress={() => router.push("/billing")}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isFree ? "star-outline" : "star"}
            size={20}
            color={isFree ? (isDark ? "#888" : "#666") : "#FFD700"}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={styles.planName}>
            {t(`plans.${plan?.id || "free"}.name`, {
              defaultValue: plan?.name || t("plans.free.name"),
            })}
          </ThemedText>
          {isFree && (
            <ThemedText style={styles.upgradeHint}>
              {t("subscription.upgradeHint")}
            </ThemedText>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#666" : "#999"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumContainer: {
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
  },
  upgradeHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});

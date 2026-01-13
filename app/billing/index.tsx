import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { PLANS, Plan, useSubscriptionStore } from "../../src/stores";

export default function BillingScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { currentPlan, fetchSubscription } = useSubscriptionStore();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSubscription(user.uid);
      }
    }, [user])
  );

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "free" || plan.id === currentPlan) return;
    router.push({
      pathname: "/billing/checkout",
      params: { planId: plan.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("billing.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">{t("billing.selectTitle")}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("billing.selectSubtitle")}
          </ThemedText>
        </View>

        {/* Current Plan Badge */}
        {currentPlan !== "free" && (
          <View
            style={[
              styles.currentPlanBadge,
              { backgroundColor: isDark ? "#1c1c1e" : "#e8f5e9" },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <ThemedText style={styles.currentPlanText}>
              {t("billing.currentPlan", {
                plan: t(`plans.${currentPlan}.name`, {
                  defaultValue:
                    PLANS.find((p) => p.id === currentPlan)?.name ||
                    t("plans.free.name"),
                }),
              })}
            </ThemedText>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isPurchasable = plan.id !== "free" && !isCurrentPlan;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
                  plan.recommended && styles.recommendedCard,
                  isCurrentPlan && {
                    borderWidth: 2,
                    borderColor: "#28a745",
                  },
                ]}
              >
                {plan.recommended && (
                  <View style={styles.recommendedBadge}>
                    <ThemedText style={styles.recommendedText}>
                      {t("billing.recommended")}
                    </ThemedText>
                  </View>
                )}

                <ThemedText type="subtitle" style={styles.planName}>
                  {t(`plans.${plan.id}.name`, { defaultValue: plan.name })}
                </ThemedText>

                <View style={styles.priceContainer}>
                  <ThemedText type="title" style={styles.price}>
                    {plan.priceDisplay}
                  </ThemedText>
                  {plan.price > 0 && (
                    <ThemedText style={styles.priceNote}>
                      {t("billing.oneTimePayment")}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={plan.recommended ? "#007AFF" : "#28a745"}
                      />
                      <ThemedText style={styles.featureText}>
                        {t(`plans.${plan.id}.features.${index}`, {
                          defaultValue: feature,
                        })}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isCurrentPlan && styles.currentButton,
                    !isPurchasable && plan.id !== "free" && styles.disabledButton,
                    plan.recommended && styles.recommendedButton,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={!isPurchasable && plan.id !== "free"}
                >
                  <ThemedText
                    style={[
                      styles.selectButtonText,
                      isCurrentPlan && styles.currentButtonText,
                    ]}
                  >
                    {isCurrentPlan
                      ? t("billing.currentPlanButton")
                      : plan.id === "free"
                      ? t("billing.freePlanButton")
                      : t("billing.purchaseButton")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={isDark ? "#888" : "#666"}
          />
          <ThemedText style={styles.infoText}>
            {t("billing.info")}
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
    marginTop: 8,
    textAlign: "center",
  },
  currentPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  currentPlanText: {
    fontSize: 14,
    fontWeight: "600",
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    position: "relative",
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  planName: {
    fontSize: 20,
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
  },
  priceNote: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  selectButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  recommendedButton: {
    backgroundColor: "#007AFF",
  },
  currentButton: {
    backgroundColor: "#28a745",
  },
  disabledButton: {
    backgroundColor: "#6c757d",
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  currentButtonText: {
    color: "#fff",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
    lineHeight: 18,
  },
});

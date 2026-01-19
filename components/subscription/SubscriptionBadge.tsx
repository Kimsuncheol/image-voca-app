import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useSubscriptionStore } from "../../src/stores";
import { FreePlansSection } from "./FreePlansSection";
import { VocaSpeakingUnlimitedSection } from "./VocaSpeakingUnlimitedSection";
import { VocaUnlimitedSection } from "./VocaUnlimitedSection";
import { styles } from "./subscriptionBadgeStyles";

export function SubscriptionBadge() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { currentPlan } = useSubscriptionStore();

  const isFree = currentPlan === "free";
  const isTopTier = currentPlan === "voca_speaking";
  const canUpgrade = !isTopTier;

  const handlePress = () => {
    if (canUpgrade) {
      router.push("/billing");
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
        !isFree && styles.premiumContainer,
      ]}
      onPress={handlePress}
      activeOpacity={canUpgrade ? 0.7 : 1}
      disabled={!canUpgrade}
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
          {/* Free users: Show all 3 plans */}
          {isFree && <FreePlansSection />}
          {/* Voca Unlimited users: Show upgrade option + current status */}
          {!isFree && currentPlan === "voca_unlimited" && (
            <VocaUnlimitedSection />
          )}
          {/* Voca + Speaking Unlimited users: Show only current status */}
          {!isFree && currentPlan === "voca_speaking" && (
            <VocaSpeakingUnlimitedSection />
          )}
        </View>
      </View>
      {canUpgrade && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#666" : "#999"}
        />
      )}
    </TouchableOpacity>
  );
}

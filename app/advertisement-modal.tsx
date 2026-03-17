import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { useSubscriptionStore } from "../src/stores";

const AD_DURATION_SECONDS = 5;

export default function AdvertisementModal() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { featureId } = useLocalSearchParams<{ featureId: string }>();
  const { unlockViaAd } = useSubscriptionStore();

  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [adFinished, setAdFinished] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Parse day number from featureId (e.g. "jpn_day_4" → 4)
  const dayMatch = featureId?.match(/_day_(\d+)$/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : null;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: AD_DURATION_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClaim = async () => {
    if (!user || !featureId) return;
    setClaiming(true);
    try {
      await unlockViaAd(user.uid, featureId);
    } finally {
      setClaiming(false);
      router.back();
    }
  };

  const handleClose = () => {
    if (!adFinished) return;
    router.back();
  };

  const bgColor = isDark ? "#000" : "#fff";
  const cardBg = isDark ? "#1c1c1e" : "#f2f2f7";
  const mutedColor = isDark ? "#8e8e93" : "#6c6c70";
  const progressBarBg = isDark ? "#2c2c2e" : "#e5e5ea";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.adLabel, { color: mutedColor }]}>
          {t("ad.label")}
        </ThemedText>
        <TouchableOpacity
          onPress={handleClose}
          disabled={!adFinished}
          style={[styles.closeButton, { opacity: adFinished ? 1 : 0.3 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color={mutedColor} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: progressBarBg }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {/* Ad placeholder */}
      <View style={[styles.adCard, { backgroundColor: cardBg }]}>
        <View style={styles.adPlaceholderIcon}>
          <Ionicons name="tv-outline" size={48} color={mutedColor} />
        </View>
        <ThemedText style={[styles.adPlaceholderTitle, { color: mutedColor }]}>
          {t("ad.placeholder")}
        </ThemedText>
      </View>

      {/* Reward info */}
      <View style={[styles.rewardCard, { backgroundColor: cardBg }]}>
        <Ionicons name="gift-outline" size={24} color="#007AFF" />
        <View style={styles.rewardText}>
          <ThemedText style={styles.rewardTitle}>
            {t("ad.rewardTitle")}
          </ThemedText>
          <ThemedText style={[styles.rewardSubtitle, { color: mutedColor }]}>
            {day != null
              ? t("ad.rewardSubtitle", { day })
              : t("ad.rewardSubtitleGeneric")}
          </ThemedText>
        </View>
      </View>

      {/* Action area */}
      <View style={styles.actionArea}>
        {!adFinished ? (
          <View style={styles.countdownRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={[styles.countdownText, { color: mutedColor }]}>
              {t("ad.watching", { seconds: secondsLeft })}
            </ThemedText>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
            onPress={handleClaim}
            disabled={claiming}
            activeOpacity={0.8}
          >
            {claiming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <ThemedText style={styles.claimButtonText}>
                  {t("ad.claimButton")}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  adLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  adCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  adPlaceholderIcon: {
    opacity: 0.5,
  },
  adPlaceholderTitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  rewardText: {
    flex: 1,
    gap: 4,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  rewardSubtitle: {
    fontSize: 13,
  },
  actionArea: {
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countdownText: {
    fontSize: 14,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    width: "100%",
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});

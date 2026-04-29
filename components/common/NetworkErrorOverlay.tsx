import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useNetworkStore } from "../../src/stores/networkStore";
import { LineHeights } from "@/constants/lineHeights";

type OverlayPhase = "hidden" | "error" | "recovered";

const FADE_MS = 300;
const RECOVERY_HOLD_MS = 1500;

export function NetworkErrorOverlay() {
  const { status } = useNetworkStatus();
  const { firebaseOffline, setFirebaseOffline } = useNetworkStore();

  const [phase, setPhase] = useState<OverlayPhase>("hidden");
  const phaseRef = useRef<OverlayPhase>("hidden");
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useSharedValue(0);

  // Mirror NetworkStatusBanner: clear Firebase offline flag on OS reconnect
  useEffect(() => {
    if (status === "reconnected") setFirebaseOffline(false);
  }, [status, setFirebaseOffline]);

  const applyPhase = useCallback((next: OverlayPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const triggerFadeOut = useCallback(() => {
    opacity.value = withTiming(
      0,
      { duration: FADE_MS, easing: Easing.in(Easing.ease) },
      (finished) => {
        if (finished) runOnJS(applyPhase)("hidden");
      },
    );
  }, [opacity, applyPhase]);

  const isOffline = status === "offline" || firebaseOffline;

  useEffect(() => {
    if (isOffline) {
      if (recoveryTimer.current) {
        clearTimeout(recoveryTimer.current);
        recoveryTimer.current = null;
      }
      if (phaseRef.current === "hidden") {
        applyPhase("error");
        opacity.value = withTiming(1, {
          duration: FADE_MS,
          easing: Easing.out(Easing.ease),
        });
      } else if (phaseRef.current === "recovered") {
        applyPhase("error");
      }
    } else {
      if (phaseRef.current === "error") {
        applyPhase("recovered");
        recoveryTimer.current = setTimeout(() => {
          recoveryTimer.current = null;
          triggerFadeOut();
        }, RECOVERY_HOLD_MS);
      }
    }
  }, [isOffline, applyPhase, triggerFadeOut]);

  useEffect(() => {
    return () => {
      if (recoveryTimer.current) clearTimeout(recoveryTimer.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const isRecovered = phase === "recovered";

  return (
    <Animated.View
      style={[styles.backdrop, animatedStyle]}
      pointerEvents={phase === "hidden" ? "none" : "auto"}
    >
      {/* Main card */}
      <View style={styles.card}>
        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, isRecovered && styles.badgeOnline]}>
            <Text style={[styles.badgeText, isRecovered && styles.badgeTextOnline]}>
              {isRecovered ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isRecovered ? "wifi-check" : "wifi-off"}
            size={80}
            color={isRecovered ? "#4CAF50" : "#9AA5B1"}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isRecovered ? "Connection\nRestored" : "Network\nConnection Lost"}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {isRecovered
            ? "You're back online. Returning you to the app shortly."
            : "We're having trouble connecting to the server. Please check your internet connection and try again."}
        </Text>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "transparent",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  badgeRow: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#1C2333",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeOnline: {
    backgroundColor: "#1A3320",
  },
  badgeText: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: "#8A9BB0",
    letterSpacing: 1,
  },
  badgeTextOnline: {
    color: "#4CAF50",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: FontSizes.headingMd,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: LineHeights.headingXxl,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: "#8A9BB0",
    textAlign: "center",
    lineHeight: LineHeights.titleMd,
    marginBottom: 8,
  },
});

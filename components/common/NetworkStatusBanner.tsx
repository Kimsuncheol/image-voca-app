import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useNetworkStatus } from "../../src/hooks/useNetworkStatus";
import { useNetworkStore } from "../../src/stores/networkStore";

const BANNER_HEIGHT = 38;

export function NetworkStatusBanner() {
  const { status } = useNetworkStatus();
  const { firebaseOffline, setFirebaseOffline } = useNetworkStore();
  const { t } = useTranslation();
  const height = useSharedValue(0);

  // Clear Firebase offline flag when network reconnects
  useEffect(() => {
    if (status === "reconnected" || status === "idle") {
      setFirebaseOffline(false);
    }
  }, [status]);

  const visible = status !== "idle" || firebaseOffline;

  useEffect(() => {
    height.value = withTiming(visible ? BANNER_HEIGHT : 0, {
      duration: 250,
      easing: visible ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
    });
  }, [visible]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value - BANNER_HEIGHT }],
  }));

  const isOffline = status === "offline" || firebaseOffline;
  const backgroundColor = isOffline ? "#cc3300" : "#28a745";
  const iconName = isOffline ? "wifi-outline" : "checkmark-circle-outline";
  const text = isOffline
    ? status === "offline"
      ? t("network.offlineBanner")
      : t("network.serverOfflineBanner")
    : t("network.reconnectedBanner");

  return (
    <Animated.View style={[styles.banner, { backgroundColor }, bannerStyle]}>
      <Ionicons name={iconName} size={15} color="#fff" />
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1000,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

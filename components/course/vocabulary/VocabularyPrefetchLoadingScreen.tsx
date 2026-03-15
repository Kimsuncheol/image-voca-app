import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, View } from "react-native";
import { ThemedText } from "../../themed-text";

interface VocabularyPrefetchLoadingScreenProps {
  day: number;
  isDark: boolean;
  courseColor?: string;
}

export function VocabularyPrefetchLoadingScreen({
  day,
  isDark,
  courseColor,
}: VocabularyPrefetchLoadingScreenProps) {
  const { t } = useTranslation();
  const accent = courseColor ?? "#007AFF";

  // Icon badge pulse
  const pulse = useRef(new Animated.Value(1)).current;

  // Three staggered dots
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const dot = (target: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(target, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(target, {
            toValue: 0.25,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.delay(640),
        ]),
      );

    Animated.parallel([dot(dot1, 0), dot(dot2, 240), dot(dot3, 480)]).start();
  }, [pulse, dot1, dot2, dot3]);

  const bg = isDark ? "#000" : "#fff";
  const textColor = isDark ? "#fff" : "#111827";
  const subColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Decorative blobs */}
      <View
        style={[
          styles.blob1,
          { backgroundColor: accent + (isDark ? "28" : "18") },
        ]}
      />
      <View
        style={[
          styles.blob2,
          { backgroundColor: accent + (isDark ? "18" : "10") },
        ]}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Pulsing icon badge */}
        <Animated.View
          style={[
            styles.iconBadge,
            { backgroundColor: accent, transform: [{ scale: pulse }] },
          ]}
        >
          <Ionicons name="book-outline" size={36} color="#fff" />
        </Animated.View>

        {/* Day label */}
        <ThemedText style={[styles.dayLabel, { color: textColor }]}>
          {t("course.dayTitle", { day })}
        </ThemedText>

        {/* Subtitle */}
        <ThemedText style={[styles.subLabel, { color: subColor }]}>
          {t("course.preparingVocabulary")}
        </ThemedText>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: accent, opacity: dot },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -80,
    right: -100,
  },
  blob2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -60,
    left: -80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  dayLabel: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

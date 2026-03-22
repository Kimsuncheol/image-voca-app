import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { ThemedText } from "../themed-text";

type QuizGenerationAnimationProps = {
  isDark: boolean;
  message?: string;
  mode?: "card" | "fullscreen";
};

const STEP_MESSAGES = [
  "Fetching words",
  "Mixing choices",
  "Preparing questions",
] as const;

const LOOP_DURATION_MS = 1400;
const STEP_DURATION_MS = 420;

export function QuizGenerationAnimation({
  isDark,
  message = "Creating quizzes...",
  mode = "card",
}: QuizGenerationAnimationProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: LOOP_DURATION_MS / 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: LOOP_DURATION_MS / 2,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) => (current + 1) % STEP_MESSAGES.length);
    }, STEP_DURATION_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const cardColors = useMemo(
    () => ({
      surface: isDark ? "#1c1c1e" : "#ffffff",
      border: isDark ? "#38383a" : "#d6dbe1",
      shadow: isDark ? "rgba(0,0,0,0.32)" : "rgba(15,23,42,0.08)",
      accent: isDark ? "#8ab4ff" : "#1f5fbf",
      muted: isDark ? "#c7c7cc" : "#6b7280",
      dot: isDark ? "#4b5563" : "#cbd5e1",
    }),
    [isDark],
  );

  const stageStyle = mode === "fullscreen" ? styles.fullscreenStage : styles.cardStage;
  const wrapperStyle = mode === "fullscreen" ? styles.fullscreenWrapper : styles.cardWrapper;

  const buildCardStyle = (
    translateInput: [number, number],
    scaleInput: [number, number],
    opacityInput: [number, number],
  ) => ({
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: opacityInput,
    }),
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: translateInput,
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: scaleInput,
        }),
      },
    ],
  });

  const frontCardStyle = buildCardStyle([8, -6], [0.98, 1], [0.82, 1]);
  const middleCardStyle = buildCardStyle([14, 2], [0.95, 0.985], [0.58, 0.76]);
  const backCardStyle = buildCardStyle([20, 8], [0.92, 0.96], [0.34, 0.52]);

  const textPulseStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1],
    }),
  };

  return (
    <View
      testID={`quiz-generation-root-${mode}`}
      style={[styles.wrapper, wrapperStyle]}
    >
      <View style={[styles.stage, stageStyle]}>
        <Animated.View
          testID="quiz-generation-card-back"
          style={[
            styles.quizCard,
            styles.cardBack,
            backCardStyle,
            {
              backgroundColor: cardColors.surface,
              borderColor: cardColors.border,
              shadowColor: cardColors.shadow,
            },
          ]}
        >
          <View style={styles.cardChipRow}>
            <View
              style={[
                styles.cardChip,
                { backgroundColor: cardColors.dot, opacity: 0.55 },
              ]}
            />
            <View
              style={[
                styles.cardChipWide,
                { backgroundColor: cardColors.dot, opacity: 0.4 },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.View
          testID="quiz-generation-card-middle"
          style={[
            styles.quizCard,
            styles.cardMiddle,
            middleCardStyle,
            {
              backgroundColor: cardColors.surface,
              borderColor: cardColors.border,
              shadowColor: cardColors.shadow,
            },
          ]}
        >
          <View style={styles.cardChipRow}>
            <View
              style={[
                styles.cardChip,
                { backgroundColor: cardColors.accent, opacity: 0.38 },
              ]}
            />
            <View
              style={[
                styles.cardChipWide,
                { backgroundColor: cardColors.dot, opacity: 0.3 },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.View
          testID="quiz-generation-card-front"
          style={[
            styles.quizCard,
            styles.cardFront,
            frontCardStyle,
            {
              backgroundColor: cardColors.surface,
              borderColor: cardColors.border,
              shadowColor: cardColors.shadow,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardBadge,
                { backgroundColor: `${cardColors.accent}22` },
              ]}
            />
            <View
              style={[
                styles.cardLineShort,
                { backgroundColor: cardColors.accent, opacity: 0.82 },
              ]}
            />
          </View>
          <View style={styles.cardBody}>
            <View
              style={[
                styles.cardLineLong,
                { backgroundColor: cardColors.dot, opacity: 0.55 },
              ]}
            />
            <View
              style={[
                styles.cardLineShort,
                { backgroundColor: cardColors.dot, opacity: 0.35 },
              ]}
            />
          </View>
          <View style={styles.cardFooter}>
            {STEP_MESSAGES.map((step, index) => (
              <View
                key={step}
                testID={`quiz-generation-dot-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === stepIndex ? cardColors.accent : cardColors.dot,
                    opacity: index === stepIndex ? 1 : 0.5,
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={textPulseStyle}>
        <ThemedText testID="quiz-generation-title" style={styles.title}>
          {message}
        </ThemedText>
      </Animated.View>
      <ThemedText
        testID="quiz-generation-step"
        style={[styles.step, { color: cardColors.muted }]}
      >
        {STEP_MESSAGES[stepIndex]}
      </ThemedText>
      <View style={styles.dotRow}>
        {STEP_MESSAGES.map((step, index) => (
          <View
            key={`${step}-footer`}
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  index === stepIndex ? cardColors.accent : cardColors.dot,
                opacity: index === stepIndex ? 1 : 0.55,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    minHeight: 280,
    paddingVertical: 12,
  },
  fullscreenWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
    width: 240,
    marginBottom: 22,
  },
  cardStage: {
    height: 120,
  },
  fullscreenStage: {
    height: 140,
  },
  quizCard: {
    position: "absolute",
    width: 204,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ViewStyle,
  cardBack: {
    height: 90,
  },
  cardMiddle: {
    height: 102,
  },
  cardFront: {
    height: 114,
  },
  cardChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardChip: {
    width: 26,
    height: 10,
    borderRadius: 999,
  },
  cardChipWide: {
    width: 72,
    height: 8,
    borderRadius: 999,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  cardBadge: {
    width: 32,
    height: 14,
    borderRadius: 999,
  },
  cardBody: {
    gap: 10,
    marginBottom: 18,
  },
  cardLineLong: {
    width: "100%",
    height: 10,
    borderRadius: 999,
  },
  cardLineShort: {
    width: "54%",
    height: 10,
    borderRadius: 999,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 6,
    marginTop: "auto",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  step: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
});

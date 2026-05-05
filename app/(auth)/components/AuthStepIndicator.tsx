import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";

const STEP_DOT_ANIMATION_MS = 160;

interface AuthStepIndicatorProps<TStep extends string> {
  steps: { key: TStep; label: string }[];
  currentStep: TStep;
  itemMinWidth?: number;
  gap?: number;
}

export function AuthStepIndicator<TStep extends string>({
  steps,
  currentStep,
  itemMinWidth = 72,
  gap = 18,
}: AuthStepIndicatorProps<TStep>) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark, itemMinWidth, gap);
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.stepItem}>
          <AuthStepDot active={index <= currentStepIndex} />
          <Text
            style={[
              styles.stepLabel,
              index === currentStepIndex && styles.stepLabelActive,
            ]}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const AuthStepDot: React.FC<{ active: boolean }> = ({ active }) => {
  const { isDark } = useTheme();
  const bg = getBackgroundColors(isDark);
  const styles = getDotStyles();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: STEP_DOT_ANIMATION_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [bg.subtleGray, bg.accent],
    ),
    transform: [{ scale: 1 + progress.value * 0.18 }],
  }));

  return <Animated.View style={[styles.stepDot, animatedStyle]} />;
};

const getStyles = (isDark: boolean, itemMinWidth: number, gap: number) => {
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    stepIndicator: {
      flexDirection: "row",
      justifyContent: "center",
      gap,
      marginBottom: 18,
    },
    stepItem: {
      alignItems: "center",
      minWidth: itemMinWidth,
    },
    stepLabel: {
      color: fontColors.supporting,
      fontSize: FontSizes.caption,
      fontWeight: FontWeights.semiBold,
    },
    stepLabelActive: {
      color: fontColors.body,
    },
  });
};

const getDotStyles = () =>
  StyleSheet.create({
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: 6,
    },
  });

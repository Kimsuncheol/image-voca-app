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
const STEP_NODE_SIZE = 24;
const STEP_LINE_HEIGHT = 3;

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
          <View style={styles.stepTimeline}>
            {index < steps.length - 1 && (
              <AuthStepConnector
                active={index < currentStepIndex}
                gap={gap}
                itemMinWidth={itemMinWidth}
              />
            )}
            <AuthStepNode active={index <= currentStepIndex} index={index} />
          </View>
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

const AuthStepNode: React.FC<{ active: boolean; index: number }> = ({
  active,
  index,
}) => {
  const { isDark } = useTheme();
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const styles = getNodeStyles();
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

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [fontColors.supporting, fontColors.inverse],
    ),
  }));

  return (
    <Animated.View style={[styles.stepNode, animatedStyle]}>
      <Animated.Text style={[styles.stepNumber, animatedTextStyle]}>
        {index + 1}
      </Animated.Text>
    </Animated.View>
  );
};

const AuthStepConnector: React.FC<{
  active: boolean;
  gap: number;
  itemMinWidth: number;
}> = ({ active, gap, itemMinWidth }) => {
  const { isDark } = useTheme();
  const bg = getBackgroundColors(isDark);
  const styles = getConnectorStyles(itemMinWidth, gap);
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
  }));

  return <Animated.View style={[styles.stepConnector, animatedStyle]} />;
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
    stepTimeline: {
      width: itemMinWidth,
      height: STEP_NODE_SIZE,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    stepLabel: {
      color: fontColors.supporting,
      fontSize: FontSizes.caption,
      fontWeight: FontWeights.semiBold,
      maxWidth: itemMinWidth,
      textAlign: "center",
    },
    stepLabelActive: {
      color: fontColors.body,
    },
  });
};

const getNodeStyles = () =>
  StyleSheet.create({
    stepNode: {
      width: STEP_NODE_SIZE,
      height: STEP_NODE_SIZE,
      borderRadius: STEP_NODE_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    stepNumber: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      lineHeight: 14,
      textAlign: "center",
    },
  });

const getConnectorStyles = (itemMinWidth: number, gap: number) =>
  StyleSheet.create({
    stepConnector: {
      position: "absolute",
      top: (STEP_NODE_SIZE - STEP_LINE_HEIGHT) / 2,
      left: itemMinWidth / 2 + STEP_NODE_SIZE / 2,
      width: itemMinWidth + gap - STEP_NODE_SIZE,
      height: STEP_LINE_HEIGHT,
      borderRadius: STEP_LINE_HEIGHT / 2,
    },
  });

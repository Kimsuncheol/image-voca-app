import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface QuizTimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isRunning: boolean;
  quizKey: string; // Used to reset timer on new question
}

export function QuizTimer({
  duration,
  onTimeUp,
  isRunning,
  quizKey,
}: QuizTimerProps) {
  const progress = useSharedValue(1);

  useEffect(() => {
    // Reset timer when key changes
    progress.value = 1;

    if (isRunning) {
      progress.value = withTiming(
        0,
        {
          duration: duration * 1000,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(onTimeUp)();
          }
        },
      );
    } else {
      cancelAnimation(progress);
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [quizKey, isRunning, duration, onTimeUp]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.2, 0.5, 1],
      ["#FF3B30", "#FF3B30", "#FFCC00", "#34C759"], // Red -> Red -> Yellow -> Green
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 6,
    width: "100%",
    backgroundColor: "#E5E5EA", // Light gray background
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
});

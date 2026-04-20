import React, { useEffect, useRef } from "react";
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
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    progress.value = 1;
    cancelAnimation(progress);
  }, [quizKey, progress]);

  useEffect(() => {
    if (isRunning) {
      const remainingDuration = Math.max(0, progress.value * duration * 1000);
      progress.value = withTiming(
        0,
        {
          duration: remainingDuration,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished) {
            runOnJS(onTimeUpRef.current)();
          }
        },
      );
    } else {
      cancelAnimation(progress);
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [quizKey, isRunning, duration, progress]);

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
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
});

import { BorderColors } from "@/constants/borderColors";
import React from "react";
import { Animated, StyleSheet, View } from "react-native";

interface QuizResultAnimationProps {
  children: React.ReactNode;
  showResult: boolean;
  isCorrect: boolean;
  questionId: string;
}

export function QuizResultAnimation({
  children,
  showResult,
  isCorrect,
  questionId,
}: QuizResultAnimationProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const translateX = React.useRef(new Animated.Value(0)).current;
  const glowOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    scale.setValue(1);
    translateX.setValue(0);
    glowOpacity.setValue(0);
  }, [glowOpacity, questionId, scale, translateX]);

  React.useEffect(() => {
    if (!showResult) {
      scale.setValue(1);
      translateX.setValue(0);
      glowOpacity.setValue(0);
      return;
    }

    if (isCorrect) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.025,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 12,
            stiffness: 180,
            mass: 0.6,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 520,
            delay: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 8,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -8,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 6,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -6,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 55,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 460,
          delay: 140,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [glowOpacity, isCorrect, scale, showResult, translateX]);

  return (
    <Animated.View
      testID="quiz-result-animation"
      style={[
        styles.container,
        {
          transform: [{ scale }, { translateX }],
        },
      ]}
    >
      {showResult && (
        <Animated.View
          pointerEvents="none"
          testID={
            isCorrect
              ? "quiz-result-correct-glow"
              : "quiz-result-incorrect-glow"
          }
          style={[
            styles.glow,
            {
              borderColor: isCorrect
                ? BorderColors.light.success
                : BorderColors.light.danger,
              backgroundColor: isCorrect ? "#28a74512" : "#dc354512",
              opacity: glowOpacity,
            },
          ]}
        />
      )}
      <View>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 2,
  },
});

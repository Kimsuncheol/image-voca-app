import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const STEP_ANIMATION_MS = 180;

interface AuthStepTransitionProps {
  stepKey: string;
  children: React.ReactNode;
}

export const AuthStepTransition: React.FC<AuthStepTransitionProps> = ({
  stepKey,
  children,
}) => {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 6;
    opacity.value = withTiming(1, {
      duration: STEP_ANIMATION_MS,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: STEP_ANIMATION_MS,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, stepKey, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

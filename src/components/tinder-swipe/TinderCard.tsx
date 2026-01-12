import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("screen");
const SWIPE_THRESHOLD = width * 0.3;

type TinderCardProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
};

export const TinderCard = ({
  onSwipeLeft,
  onSwipeRight,
  children,
}: TinderCardProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const PanGesture = Gesture.Pan()
    .onStart((event) => {
      prevTranslationX.value = event.translationX;
      prevTranslationY.value = event.translationY;
    })
    .onUpdate((event) => {
      translateX.value = prevTranslationX.value + event.translationX;
      translateY.value =
        prevTranslationY.value + Math.min(0, event.translationY);
      rotate.value = event.translationX / 10;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(width * 2, { duration: 400 });
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-width * 2, { duration: 400 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={PanGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

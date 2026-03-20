import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface Props {
  visible: boolean;
  onHidden: () => void;
}

export function AppSplashScreen({ visible, onHidden }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.82);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    logoScale.value = withSpring(1, { damping: 15, stiffness: 90 });
  }, []);

  useEffect(() => {
    if (!visible) {
      containerOpacity.value = withTiming(
        0,
        { duration: 350, easing: Easing.in(Easing.ease) },
        (finished) => {
          if (finished) runOnJS(onHidden)();
        },
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Image
         
        source={require("../../assets/images/icon.png")}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    width: 200,
    height: 200,
  },
});

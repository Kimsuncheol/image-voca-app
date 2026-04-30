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

import { useColorScheme } from "../../hooks/use-color-scheme";

interface Props {
  visible: boolean;
  onHidden: () => void;
}

export function AppSplashScreen({ visible, onHidden }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.82);
  const logoOpacity = useSharedValue(0);
  const logoSource = isDark
    ? require("../../assets/images/icon.png")
    : require("../../assets/images/icon_white.png");

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
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#fff" },
        containerStyle,
      ]}
    >
      <Animated.Image
        source={logoSource}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    width: 200,
    height: 200,
  },
});

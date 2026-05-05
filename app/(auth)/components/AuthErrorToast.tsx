import { FontSizes } from "@/constants/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";

const TOAST_ANIMATION_MS = 160;

interface AuthErrorToastProps {
  message?: string | null;
  onClose?: () => void;
}

export const AuthErrorToast: React.FC<AuthErrorToastProps> = ({
  message,
  onClose,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);
  const opacity = useSharedValue(message ? 1 : 0);
  const translateY = useSharedValue(message ? 0 : -6);

  const animateOut = useCallback(
    (afterExit?: () => void) => {
      opacity.value = withTiming(0, {
        duration: TOAST_ANIMATION_MS,
        easing: Easing.in(Easing.ease),
      });
      translateY.value = withTiming(
        -6,
        {
          duration: TOAST_ANIMATION_MS,
          easing: Easing.in(Easing.ease),
        },
        (finished) => {
          if (!finished) return;
          if (afterExit) {
            runOnJS(afterExit)();
          }
        },
      );
    },
    [opacity, translateY],
  );

  useEffect(() => {
    if (message) {
      opacity.value = 0;
      translateY.value = -6;
      opacity.value = withTiming(1, {
        duration: TOAST_ANIMATION_MS,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: TOAST_ANIMATION_MS,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [message, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.toast, animatedStyle]}
      accessibilityRole="alert"
    >
      <Ionicons
        name="alert-circle"
        size={18}
        color={fontColors.iconError}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      {onClose && (
        <TouchableOpacity
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={() => animateOut(onClose)}
          style={styles.close}
        >
          <Ionicons name="close" size={18} color={fontColors.iconError} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    toast: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: bg.accentRedDeep,
      borderColor: fontColors.errorBannerBorder,
    },
    icon: {
      marginRight: 8,
    },
    message: {
      flex: 1,
      color: fontColors.authErrorMessage,
      fontSize: FontSizes.label,
    },
    close: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
  });
};

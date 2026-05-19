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
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useTheme } from "../../src/context/ThemeContext";

const TOAST_ANIMATION_MS = 160;

interface AppToastProps {
  message?: string | null;
  onClose?: () => void;
  floating?: boolean;
  variant?: "error" | "success";
}

export const AppToast: React.FC<AppToastProps> = ({
  message,
  onClose,
  floating = false,
  variant = "error",
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
      style={[
        styles.toast,
        variant === "success" ? styles.successToast : styles.errorToast,
        floating && styles.floatingToast,
        animatedStyle,
      ]}
      accessibilityRole="alert"
    >
      <Ionicons
        name={variant === "success" ? "checkmark-circle" : "alert-circle"}
        size={18}
        color={
          variant === "success" ? fontColors.successText : fontColors.iconError
        }
        style={styles.icon}
      />
      <Text
        style={[
          styles.message,
          variant === "success" ? styles.successMessage : styles.errorMessage,
        ]}
      >
        {message}
      </Text>
      {onClose && (
        <TouchableOpacity
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={() => animateOut(onClose)}
          style={styles.close}
        >
          <Ionicons
            name="close"
            size={18}
            color={
              variant === "success"
                ? fontColors.successText
                : fontColors.iconError
            }
          />
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
      alignItems: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    errorToast: {
      backgroundColor: bg.accentRedDeep,
      borderColor: fontColors.errorBannerBorder,
    },
    successToast: {
      backgroundColor: bg.accentGreenDeep,
      borderColor: fontColors.successBorderAlt,
    },
    floatingToast: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
    },
    icon: {
      marginRight: 8,
    },
    message: {
      flex: 1,
      fontSize: FontSizes.label,
      lineHeight: FontSizes.label * 1.35,
    },
    errorMessage: {
      color: fontColors.authErrorMessage,
    },
    successMessage: {
      color: fontColors.passwordResetSuccessText,
    },
    close: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
  });
};

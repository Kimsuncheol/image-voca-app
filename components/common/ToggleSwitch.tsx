import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
}

const TOGGLE_WIDTH = 42;
const TOGGLE_HEIGHT = 20;
const TOGGLE_THUMB = 28;
const TOGGLE_OVERLAP = 2;
const TOGGLE_TOP_OFFSET = (TOGGLE_HEIGHT - TOGGLE_THUMB) / 2;

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  trackColor = { false: "#767577", true: "#007AFF" },
}: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: translateX.interpolate({
            inputRange: [0, 1],
            outputRange: [
              -TOGGLE_OVERLAP,
              TOGGLE_WIDTH - TOGGLE_THUMB + TOGGLE_OVERLAP,
            ],
          }),
        },
      ],
    }),
    [translateX],
  );

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateX, value]);

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.track,
        { backgroundColor: value ? trackColor.true : trackColor.false },
        disabled && styles.disabled,
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View style={[styles.thumb, animatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    justifyContent: "center",
    overflow: "visible",
  },
  thumb: {
    width: TOGGLE_THUMB,
    height: TOGGLE_THUMB,
    borderRadius: TOGGLE_THUMB / 2,
    position: "absolute",
    top: TOGGLE_TOP_OFFSET,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
  },
  disabled: {
    opacity: 0.5,
  },
});

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";

export interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  trackColor?: { false: string; true: string };
}

const TOGGLE_WIDTH = 50;
const TOGGLE_HEIGHT = 30;
const TOGGLE_PADDING = 2;
const TOGGLE_THUMB = TOGGLE_HEIGHT - TOGGLE_PADDING * 2;

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  trackColor = { false: "#767577", true: "#34C759" },
}: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateX: translateX.interpolate({
            inputRange: [0, 1],
            outputRange: [
              TOGGLE_PADDING,
              TOGGLE_WIDTH - TOGGLE_THUMB - TOGGLE_PADDING,
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
  },
  thumb: {
    width: TOGGLE_THUMB,
    height: TOGGLE_THUMB,
    borderRadius: TOGGLE_THUMB / 2,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});

import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
} from "react-native";

const completedStamp = require("../../assets/images/completed-stamp.png");

interface CompletedStampProps {
  testID: string;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}

export function CompletedStamp({
  testID,
  accessibilityLabel,
  style,
}: CompletedStampProps) {
  return (
    <Image
      testID={testID}
      source={completedStamp}
      style={[styles.stamp, style]}
      resizeMode="contain"
      pointerEvents="none"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: "absolute",
    top: -12,
    right: 12,
    width: 96,
    height: 68,
    zIndex: 1,
    transform: [{ rotate: "-15deg" }],
  },
});

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface NativeAdDisclosureButtonProps {
  onPress: () => void;
  bannerHeight: number;
}

const DISCLOSURE_WIDTH = 14;
const DISCLOSURE_COLOR = "#9ca3af";

export function NativeAdDisclosureButton({
  onPress,
  bannerHeight,
}: NativeAdDisclosureButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Open ad disclosure panel"
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.disclosureTrigger,
        { top: (bannerHeight - DISCLOSURE_WIDTH) / 2 },
      ]}
      testID="top-install-native-ad-disclosure-trigger"
    >
      <Ionicons name="ellipsis-vertical" size={8} color={DISCLOSURE_COLOR} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disclosureTrigger: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: DISCLOSURE_WIDTH / 2,
    borderWidth: 1,
    borderColor: DISCLOSURE_COLOR,
    height: DISCLOSURE_WIDTH,
    justifyContent: "center",
    left: 7,
    position: "absolute",
    width: DISCLOSURE_WIDTH,
    zIndex: 2,
  },
});

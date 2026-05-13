import { Image, ImageStyle } from "expo-image";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { EyeComfortImageOverlay } from "../../src/components/common/EyeComfortImageOverlay";
import { ImagePlaceholder } from "./ImagePlaceholder";

export interface CollocationCardImageProps {
  imageUrl?: string | null;
  isDark: boolean;
  style?: StyleProp<ImageStyle> | StyleProp<ViewStyle>;
  onImageLoad?: () => void;
}

export function CollocationCardImage({
  imageUrl,
  isDark,
  style,
  onImageLoad,
}: CollocationCardImageProps) {
  if (imageUrl) {
    return (
      <View
        testID="collocation-card-image-frame"
        style={[style as StyleProp<ViewStyle>, styles.imageFrame]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.fill}
          contentFit="contain"
          cachePolicy="memory-disk"
          onLoad={onImageLoad}
          onError={onImageLoad}
        />
        <EyeComfortImageOverlay />
      </View>
    );
  }

  return (
    <View
      testID="collocation-card-image-frame"
      style={[style as StyleProp<ViewStyle>, styles.imageFrame]}
    >
      <ImagePlaceholder isDark={isDark} style={styles.fill} />
      <EyeComfortImageOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  imageFrame: {
    position: "relative",
    overflow: "hidden",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});

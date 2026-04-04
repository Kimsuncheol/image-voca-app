import { Image } from "expo-image";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ImagePlaceholder } from "../common/ImagePlaceholder";

interface SwipeCardItemImageSectionProps {
  imageUrl?: string;
  isDark: boolean;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
  topRightOverlay?: React.ReactNode;
}

export function SwipeCardItemImageSection({
  imageUrl,
  isDark,
  testID,
  containerStyle,
  topRightOverlay,
}: SwipeCardItemImageSectionProps) {
  return (
    <View testID={testID} style={[styles.imageContainer, containerStyle]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <ImagePlaceholder isDark={isDark} style={styles.cardImage} />
      )}
      {topRightOverlay ? (
        <View testID="swipe-card-image-top-right-overlay" style={styles.topRightOverlay}>
          {topRightOverlay}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: "35%",
    width: "100%",
    position: "relative",
  },
  cardImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  topRightOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
});

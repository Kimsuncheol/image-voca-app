import { Image } from "expo-image";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { ImagePlaceholder } from "../common/ImagePlaceholder";
import {
  blackCardSharedStyles,
  blackCardSpacing,
} from "../course/vocabulary/blackCardStyles";

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
  const bgColors = getBackgroundColors(isDark);

  return (
    <View
      testID={testID}
      style={[
        styles.imageContainer,
        { backgroundColor: bgColors.learningCardSurface },
        containerStyle,
      ]}
    >
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
    height: "38%",
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingTop: blackCardSpacing.contentTop,
  },
  cardImage: {
    height: "86%",
    width: "100%",
    resizeMode: "cover",
    borderRadius: 0,
  },
  topRightOverlay: {
    ...blackCardSharedStyles.VocaCardTopRightControl,
  },
});

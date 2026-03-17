import { Image } from "expo-image";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ImagePlaceholder } from "../common/ImagePlaceholder";

interface SwipeCardItemImageSectionProps {
  imageUrl?: string;
  isDark: boolean;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SwipeCardItemImageSection({
  imageUrl,
  isDark,
  testID,
  containerStyle,
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
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: "35%",
    width: "100%",
  },
  cardImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },

});

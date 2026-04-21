import { Image, ImageStyle } from "expo-image";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
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
      <Image
        source={{ uri: imageUrl }}
        style={style as StyleProp<ImageStyle>}
        contentFit="cover"
        cachePolicy="memory-disk"
        onLoad={onImageLoad}
        onError={onImageLoad}
      />
    );
  }

  return <ImagePlaceholder isDark={isDark} style={style as StyleProp<ViewStyle>} />;
}

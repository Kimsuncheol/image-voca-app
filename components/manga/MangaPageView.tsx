import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import {
  ResumableZoom,
  type SwipeDirection,
} from "react-native-zoom-toolkit";

interface MangaPageViewProps {
  uri: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
}

export function MangaPageView({
  uri,
  onSwipeLeft,
  onSwipeRight,
  onTap,
}: MangaPageViewProps) {
  const { width, height } = useWindowDimensions();

  const handleSwipe = (direction: SwipeDirection) => {
    if (direction === "left") {
      onSwipeLeft?.();
      return;
    }

    if (direction === "right") {
      onSwipeRight?.();
    }
  };

  return (
    <View style={styles.container}>
      <ResumableZoom onSwipe={handleSwipe} onTap={onTap}>
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </ResumableZoom>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

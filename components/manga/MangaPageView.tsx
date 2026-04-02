import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { ResumeZoom } from "react-native-zoom-toolkit";

interface MangaPageViewProps {
  uri: string;
}

export function MangaPageView({ uri }: MangaPageViewProps) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <ResumeZoom width={width} height={height}>
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </ResumeZoom>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

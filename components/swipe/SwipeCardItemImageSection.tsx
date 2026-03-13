import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

interface SwipeCardItemImageSectionProps {
  imageUrl?: string;
  isDark: boolean;
}

export function SwipeCardItemImageSection({
  imageUrl,
  isDark,
}: SwipeCardItemImageSectionProps) {
  return (
    <View style={styles.imageContainer}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder]}>
          <Ionicons
            name="image-outline"
            size={48}
            color={isDark ? "#555" : "#ccc"}
          />
        </View>
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
  imagePlaceholder: {
    backgroundColor: "#9f9f9f",
    justifyContent: "center",
    alignItems: "center",
  },
});

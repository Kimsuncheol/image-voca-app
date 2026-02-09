import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface SwipeCardItemImageSectionProps {
  image?: string;
  isDark: boolean;
}

export function SwipeCardItemImageSection({
  image,
  isDark,
}: SwipeCardItemImageSectionProps) {
  return (
    <View style={styles.imageContainer}>
      {image ? (
        <Image source={{ uri: image }} style={styles.cardImage} />
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
});

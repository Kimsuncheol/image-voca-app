import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

export interface VocabularyCard {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  example: string;
  image: string;
}

interface SwipeCardItemProps {
  item: VocabularyCard;
}

export function SwipeCardItem({ item }: SwipeCardItemProps) {
  const speak = () => {
    Speech.speak(item.word);
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{item.word}</Text>
          <TouchableOpacity onPress={speak} style={styles.speakerButton}>
            <Ionicons name="volume-medium" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        {item.pronunciation && (
          <Text style={styles.cardSubtitle}>{item.pronunciation}</Text>
        )}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.definition}
        </Text>
        <Text style={styles.cardExample}>&quot;{item.example}&quot;</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  cardImage: {
    height: "65%",
    width: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    height: "35%",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  speakerButton: {
    marginLeft: 10,
    padding: 5,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 18,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 16,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  cardExample: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: "#333",
    paddingLeft: 8,
    marginTop: 4,
  },
});

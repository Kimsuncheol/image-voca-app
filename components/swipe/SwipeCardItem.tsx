import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export interface CardData {
  id: string;
  name: string;
  age: number;
  image: string;
}

interface SwipeCardItemProps {
  item: CardData;
}

export function SwipeCardItem({ item }: SwipeCardItemProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>
          {item.name}, {item.age}
        </Text>
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
    height: "85%",
    width: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    height: "15%",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

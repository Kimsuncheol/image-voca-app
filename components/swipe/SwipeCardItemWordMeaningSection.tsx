import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";

interface SwipeCardItemWordMeaningSectionProps {
  word: string;
  pronunciation?: string;
  meaning: string;
  isDark: boolean;
}

export function SwipeCardItemWordMeaningSection({
  word,
  pronunciation,
  meaning,
  isDark,
}: SwipeCardItemWordMeaningSectionProps) {
  const { speak: speakText } = useSpeech();

  const speak = () => {
    speakText(word, {
      language: "en-US",
      rate: 0.9,
    });
  };

  return (
    <>
      {/* Word & Meaning Section */}
      <View style={styles.titleContainer}>
        <Text
          style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
        >
          {word}
        </Text>
        <TouchableOpacity
          onPress={speak}
          style={[
            styles.speakerButton,
            { backgroundColor: isDark ? "#2c2c2c" : "#F5F5F5" },
          ]}
        >
          <Ionicons
            name="volume-medium"
            size={24}
            color={isDark ? "#aaa" : "#666"}
          />
        </TouchableOpacity>
      </View>
      {pronunciation && (
        <Text
          style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
        >
          {pronunciation}
        </Text>
      )}
      <Text
        style={[
          styles.cardDescription,
          { color: isDark ? "#e0e0e0" : "#2c2c2c" },
        ]}
        numberOfLines={2}
      >
        {meaning}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  speakerButton: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 17,
    color: "#2c2c2c",
    lineHeight: 24,
    marginBottom: 8,
    fontWeight: "500",
  },
});

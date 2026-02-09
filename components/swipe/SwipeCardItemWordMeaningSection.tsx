import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemAddToWordBankButton } from "./SwipeCardItemAddToWordBankButton";

interface SwipeCardItemWordMeaningSectionProps {
  item: VocabularyCard;
  word: string;
  pronunciation?: string;
  meaning: string;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItemWordMeaningSection({
  item,
  word,
  pronunciation,
  meaning,
  isDark,
  initialIsSaved = false,
  day,
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
        <View style={styles.leftRow}>
          <Text
            style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
            numberOfLines={1}
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
        <View style={styles.addButtonContainer}>
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved}
            day={day}
          />
        </View>
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
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  addButtonContainer: {
    marginLeft: "auto",
    paddingLeft: 12,
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
    flexShrink: 1,
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

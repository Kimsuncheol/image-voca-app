import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";

const { width } = Dimensions.get("window");

interface SwipeCardItemProps {
  item: VocabularyCard;
}

export function SwipeCardItem({ item }: SwipeCardItemProps) {
  const { user } = useAuth();
  const { recordWordLearned } = useUserStatsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { t } = useTranslation();

  const speak = () => {
    Speech.speak(item.word);
  };

  const addToWordBank = async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("swipe.errors.loginRequired"));
      return;
    }

    if (isAdded) {
      Alert.alert(t("common.info"), t("swipe.errors.alreadyAdded"));
      return;
    }

    setIsAdding(true);
    try {
      const wordRef = doc(db, "vocabank", user.uid, "course", item.course);
      await setDoc(
        wordRef,
        {
          words: arrayUnion({
            id: item.id,
            word: item.word,
            meaning: item.meaning,
            pronunciation: item.pronunciation || "",
            example: item.example,
            course: item.course,
            addedAt: new Date().toISOString(),
          }),
        },
        { merge: true }
      );
      setIsAdded(true);
      // Record word learned for stats
      await recordWordLearned(user.uid);
      Alert.alert(
        t("common.success"),
        t("swipe.success.addedToWordBank", { word: item.word })
      );
    } catch (error) {
      console.error("Error adding to word bank:", error);
      Alert.alert(t("common.error"), t("swipe.errors.addFailed"));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      )}
      <View style={[styles.cardInfo, !item.image && styles.cardInfoFull]}>
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
          {item.meaning}
        </Text>
        <Text style={styles.cardExample} numberOfLines={2}>
          &quot;{item.example}&quot;
        </Text>

        {/* Add to Word Bank Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isAdded && styles.addButtonAdded,
            isAdding && styles.addButtonDisabled,
          ]}
          onPress={addToWordBank}
          disabled={isAdding || isAdded}
        >
          <Ionicons
            name={isAdded ? "checkmark-circle" : "add-circle-outline"}
            size={20}
            color={isAdded ? "#fff" : "#007AFF"}
          />
          <Text
            style={[styles.addButtonText, isAdded && styles.addButtonTextAdded]}
          >
            {isAdding
              ? t("swipe.actions.adding")
              : isAdded
              ? t("swipe.actions.added")
              : t("swipe.actions.addToWordBank")}
          </Text>
        </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  cardImage: {
    height: "50%",
    width: "100%",
    resizeMode: "cover",
  },
  cardInfo: {
    height: "50%",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cardInfoFull: {
    height: "100%",
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
    fontSize: 28,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
    marginBottom: 6,
  },
  cardExample: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: "#333",
    paddingLeft: 8,
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4FD",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  addButtonAdded: {
    backgroundColor: "#28a745",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  addButtonTextAdded: {
    color: "#fff",
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";

const { width } = Dimensions.get("window");

interface SwipeCardItemProps {
  item: VocabularyCard;
}

export function SwipeCardItem({ item }: SwipeCardItemProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();
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
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
      ]}
    >
      {/* Always reserve space for image */}
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
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
      <View
        style={[
          styles.cardInfo,
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        <View style={styles.titleContainer}>
          <Text
            style={[styles.cardTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}
          >
            {item.word}
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
        {item.pronunciation && (
          <Text
            style={[styles.cardSubtitle, { color: isDark ? "#999" : "#666" }]}
          >
            {item.pronunciation}
          </Text>
        )}
        <Text
          style={[
            styles.cardDescription,
            { color: isDark ? "#e0e0e0" : "#2c2c2c" },
          ]}
          numberOfLines={2}
        >
          {item.meaning}
        </Text>
        <Text
          style={[
            styles.cardExample,
            { color: isDark ? "#b0b0b0" : "#444" },
            { borderLeftColor: isDark ? "#0a84ff" : "#007AFF" },
          ]}
          numberOfLines={2}
        >
          &quot;{item.example}&quot;
        </Text>

        {/* Add to Word Bank Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isAdded && styles.addButtonAdded,
            isAdding && styles.addButtonDisabled,
            !isAdded && {
              backgroundColor: isDark ? "#1c3a52" : "#E8F4FD",
              borderColor: isDark ? "#0a84ff80" : "#007AFF40",
            },
          ]}
          onPress={addToWordBank}
          disabled={isAdding || isAdded}
        >
          <Ionicons
            name={isAdded ? "checkmark-circle" : "add-circle-outline"}
            size={20}
            color={isAdded ? "#fff" : isDark ? "#0a84ff" : "#007AFF"}
          />
          <Text
            style={[
              styles.addButtonText,
              isAdded && styles.addButtonTextAdded,
              !isAdded && { color: isDark ? "#0a84ff" : "#007AFF" },
            ]}
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
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  cardImage: {
    height: "60%",
    width: "100%",
    resizeMode: "cover",
  },
  imageContainer: {
    height: "60%",
    width: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    height: "40%",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
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
  cardExample: {
    fontSize: 14,
    color: "#444",
    fontStyle: "italic",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    paddingLeft: 12,
    marginTop: 8,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4FD",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#007AFF40",
  },
  addButtonAdded: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },
  addButtonTextAdded: {
    color: "#fff",
  },
});

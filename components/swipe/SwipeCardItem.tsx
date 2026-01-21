import { Ionicons } from "@expo/vector-icons";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Dimensions, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SwipeCardItemImageSection } from "./SwipeCardItemImageSection";
import { SwipeCardItemMeaningExampleSentenceSection } from "./SwipeCardItemMeaningExampleSentenceSection";

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
            translation: item.translation || "",
            pronunciation: item.pronunciation || "",
            example: item.example,
            course: item.course,
            addedAt: new Date().toISOString(),
          }),
        },
        { merge: true },
      );
      setIsAdded(true);
      // Record word learned for stats
      await recordWordLearned(user.uid);
      Alert.alert(
        t("common.success"),
        t("swipe.success.addedToWordBank", { word: item.word }),
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
      {/* Image Section */}
      <SwipeCardItemImageSection image={item.image} isDark={isDark} />

      {/* Card Info Section */}
      <View
        style={[
          styles.cardInfo,
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        {/* Merged Word, Meaning & Example Section */}
        <SwipeCardItemMeaningExampleSentenceSection
          word={item.word}
          pronunciation={item.pronunciation}
          meaning={item.meaning}
          example={item.example}
          translation={item.translation}
          isDark={isDark}
        />

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
  cardInfo: {
    height: "55%",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#fff",
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

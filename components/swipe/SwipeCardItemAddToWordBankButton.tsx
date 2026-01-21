import { Ionicons } from "@expo/vector-icons";
import { arrayUnion, doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";

interface SwipeCardItemAddToWordBankButtonProps {
  item: VocabularyCard;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
}

export function SwipeCardItemAddToWordBankButton({
  item,
  isDark,
  initialIsSaved = false,
  day,
}: SwipeCardItemAddToWordBankButtonProps) {
  const { user } = useAuth();
  const { recordWordLearned } = useUserStatsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(initialIsSaved);
  const { t } = useTranslation();

  React.useEffect(() => {
    setIsAdded(initialIsSaved);
  }, [initialIsSaved]);

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
            day: day,
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
  );
}

const styles = StyleSheet.create({
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

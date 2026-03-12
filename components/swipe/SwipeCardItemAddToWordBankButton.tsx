import { Ionicons } from "@expo/vector-icons";
import { doc, runTransaction } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";
import { SavedWord } from "../wordbank/WordCard";

interface SwipeCardItemAddToWordBankButtonProps {
  item: VocabularyCard;
  isDark: boolean;
  initialIsSaved?: boolean;
  day?: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

export function SwipeCardItemAddToWordBankButton({
  item,
  isDark,
  initialIsSaved = false,
  day,
  onSavedWordChange,
}: SwipeCardItemAddToWordBankButtonProps) {
  const { user } = useAuth();
  const { recordWordLearned } = useUserStatsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(initialIsSaved);
  const { t } = useTranslation();

  React.useEffect(() => {
    setIsAdded(initialIsSaved);
  }, [initialIsSaved]);

  const toggleWordBank = async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("swipe.errors.loginRequired"));
      return;
    }

    setIsAdding(true);
    try {
      const wordRef = doc(db, "vocabank", user.uid, "course", item.course);
      const action = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(wordRef);
        const existingWords: SavedWord[] = snap.exists()
          ? snap.data().words || []
          : [];

        // Normalize away duplicates that may already exist.
        const dedupedWords = Array.from(
          new Map(existingWords.map((word) => [word.id, word])).values(),
        );

        if (dedupedWords.some((word) => word.id === item.id)) {
          const updatedWords = dedupedWords.filter((word) => word.id !== item.id);
          transaction.set(wordRef, { words: updatedWords }, { merge: true });
          return "removed" as const;
        }

        const newWord: SavedWord = {
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          translation: item.translation || "",
          pronunciation: item.pronunciation || "",
          example: item.example,
          course: item.course,
          day,
          addedAt: new Date().toISOString(),
        };

        transaction.set(
          wordRef,
          { words: [...dedupedWords, newWord] },
          { merge: true },
        );
        return "added" as const;
      });

      if (action === "removed") {
        setIsAdded(false);
        onSavedWordChange?.(item.id, false);
        return;
      }

      setIsAdded(true);
      onSavedWordChange?.(item.id, true);
      // Record word learned for stats
      await recordWordLearned(user.uid);
    } catch (error) {
      console.error("Error toggling word bank:", error);
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
      onPress={toggleWordBank}
      disabled={isAdding}
    >
      <Ionicons
        name={isAdded ? "bookmark" : "bookmark-outline"}
        size={24}
        color={isAdded ? "#fff" : isDark ? "#0a84ff" : "#007AFF"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
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
});

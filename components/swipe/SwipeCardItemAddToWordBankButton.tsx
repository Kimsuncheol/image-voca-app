import { Ionicons } from "@expo/vector-icons";
import { doc, runTransaction } from "firebase/firestore";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { VocabularyCard } from "../../src/types/vocabulary";
import { sanitizeSavedWordForFirestore } from "../../src/utils/savedWordFirestore";
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

        const newWord = sanitizeSavedWordForFirestore({
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          translation: item.translation || "",
          synonyms: item.synonyms,
          pronunciation: item.pronunciation || "",
          pronunciationRoman: item.pronunciationRoman,
          example: item.example,
          exampleHurigana: item.exampleHurigana,
          course: item.course,
          day,
          addedAt: new Date().toISOString(),
          imageUrl: item.imageUrl,
          localized: item.localized,
        } as SavedWord);

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
      testID="swipe-card-add-to-wordbank-button"
      style={[
        styles.addButton,
        isAdded && styles.addButtonAdded,
        isAdding && styles.addButtonDisabled,
        !isAdded && {
          backgroundColor: "#FFFFFF",
          borderColor: "#000000",
        },
      ]}
      onPress={toggleWordBank}
      disabled={isAdding}
    >
      <Ionicons
        testID="swipe-card-add-to-wordbank-icon"
        name={isAdded ? "star" : "star-outline"}
        size={18}
        color={isAdded ? "#4A3600" : "#000000"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  addButtonAdded: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
});

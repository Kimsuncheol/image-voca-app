import { Ionicons } from "@expo/vector-icons";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { sanitizeSavedWordForFirestore } from "../../src/utils/savedWordFirestore";
import type { SavedWord } from "./WordCard";

type AddToWordBankButtonVariant = "star" | "bookmark";

interface AddToWordBankButtonProps {
  buildSavedWord: () => SavedWord;
  course: string;
  initialIsSaved?: boolean;
  isDark: boolean;
  itemId: string;
  onRemoved?: (itemId: string) => void;
  onSavedStateChange?: (itemId: string, isSaved: boolean) => void;
  testIDPrefix?: string;
  variant?: AddToWordBankButtonVariant;
}

export function AddToWordBankButton({
  buildSavedWord,
  course,
  initialIsSaved = false,
  isDark,
  itemId,
  onRemoved,
  onSavedStateChange,
  testIDPrefix,
  variant = "star",
}: AddToWordBankButtonProps) {
  const { user } = useAuth();
  const { recordWordLearned } = useUserStatsStore();
  const [isAdding, setIsAdding] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(initialIsSaved);
  const { t } = useTranslation();

  React.useEffect(() => {
    setIsAdded(initialIsSaved);
  }, [initialIsSaved]);

  const toggleWordBank = React.useCallback(async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("swipe.errors.loginRequired"));
      return;
    }

    setIsAdding(true);
    try {
      const wordRef = doc(db, "vocabank", user.uid, "course", course);
      const action = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(wordRef);
        const existingWords: SavedWord[] = snap.exists()
          ? snap.data().words || []
          : [];

        const dedupedWords = Array.from(
          new Map(existingWords.map((word) => [word.id, word])).values(),
        );

        if (dedupedWords.some((word) => word.id === itemId)) {
          const updatedWords = dedupedWords.filter((word) => word.id !== itemId);
          transaction.set(wordRef, { words: updatedWords }, { merge: true });
          return "removed" as const;
        }

        const newWord = sanitizeSavedWordForFirestore(buildSavedWord());
        transaction.set(
          wordRef,
          { words: [...dedupedWords, newWord] },
          { merge: true },
        );
        return "added" as const;
      });

      if (action === "removed") {
        setIsAdded(false);
        onSavedStateChange?.(itemId, false);
        onRemoved?.(itemId);
        return;
      }

      setIsAdded(true);
      onSavedStateChange?.(itemId, true);
      await recordWordLearned(user.uid);
    } catch (error) {
      console.error("Error toggling word bank:", error);
      Alert.alert(t("common.error"), t("swipe.errors.addFailed"));
    } finally {
      setIsAdding(false);
    }
  }, [
    buildSavedWord,
    course,
    itemId,
    onRemoved,
    onSavedStateChange,
    recordWordLearned,
    t,
    user,
  ]);

  const iconName = variant === "bookmark"
    ? (isAdded ? "bookmark" : "bookmark-outline")
    : (isAdded ? "star" : "star-outline");
  const iconColor = variant === "bookmark"
    ? (isAdded ? "#fff" : isDark ? "#0a84ff" : "#007AFF")
    : (isAdded ? "#4A3600" : "#000000");
  const iconSize = variant === "bookmark" ? 20 : 18;

  if (variant === "bookmark") {
    return (
      <Pressable
        testID={testIDPrefix ? `${testIDPrefix}-button` : undefined}
        style={({ pressed }) => [
          styles.baseButton,
          styles.bookmarkButton,
          isAdded ? styles.bookmarkButtonAdded : (
            isDark ? styles.bookmarkButtonDark : styles.bookmarkButtonLight
          ),
          isAdding && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={toggleWordBank}
        disabled={isAdding}
      >
        <Ionicons
          testID={testIDPrefix ? `${testIDPrefix}-icon` : undefined}
          name={iconName}
          size={iconSize}
          color={iconColor}
        />
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      testID={testIDPrefix ? `${testIDPrefix}-button` : undefined}
      style={[
        styles.baseButton,
        styles.starButton,
        isAdded ? styles.starButtonAdded : styles.starButtonIdle,
        isAdding && styles.buttonDisabled,
      ]}
      onPress={toggleWordBank}
      disabled={isAdding}
    >
      <Ionicons
        testID={testIDPrefix ? `${testIDPrefix}-icon` : undefined}
        name={iconName}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  starButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  starButtonIdle: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
  },
  starButtonAdded: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  bookmarkButton: {
    position: "absolute",
    top: 28,
    right: 28,
    width: 38,
    height: 38,
    borderRadius: 10,
    zIndex: 3,
  },
  bookmarkButtonLight: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderColor: "rgba(0, 122, 255, 0.2)",
  },
  bookmarkButtonDark: {
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderColor: "rgba(10, 132, 255, 0.25)",
  },
  bookmarkButtonAdded: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

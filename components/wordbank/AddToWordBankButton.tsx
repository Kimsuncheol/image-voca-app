import { FontAwesome, Ionicons } from "@expo/vector-icons";
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
          const updatedWords = dedupedWords.filter(
            (word) => word.id !== itemId,
          );
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

  const iconName =
    variant === "bookmark"
      ? isAdded
        ? "sticky-note"
        : "sticky-note-o"
      : isAdded
        ? "star"
        : "star-outline";
  const iconColor =
    variant === "bookmark"
      ? isDark
        ? "#0a84ff"
        : "#007AFF"
      : isAdded
        ? "#4A3600"
        : "#FFFFFF";
  const iconSize = variant === "bookmark" ? 28 : 18;

  if (variant === "bookmark") {
    return (
      <Pressable
        testID={testIDPrefix ? `${testIDPrefix}-button` : undefined}
        style={({ pressed }) => [
          styles.baseButton,
          styles.bookmarkButton,
          isAdding && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={toggleWordBank}
        disabled={isAdding}
      >
        <FontAwesome
          testID={testIDPrefix ? `${testIDPrefix}-icon` : undefined}
          name={iconName as any}
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
        name={iconName as any}
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
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  starButtonIdle: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderColor: "rgba(255,255,255,0.82)",
  },
  starButtonAdded: {
    backgroundColor: "#F4C542",
    borderColor: "#F4C542",
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    zIndex: 3,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});

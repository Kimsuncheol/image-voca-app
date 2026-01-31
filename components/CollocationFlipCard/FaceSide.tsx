import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { SavedWord } from "../wordbank/WordCard";
import { CollocationData, CollocationWordBankConfig } from "./types";

interface FaceSideProps {
  data: CollocationData;
  isDark: boolean;
  wordBankConfig?: CollocationWordBankConfig;
  onFlip?: () => void;
}

/**
 * FaceSide Component for CollocationFlipCard
 *
 * Displays the "Front" of the flashcard.
 *
 * Main Content:
 * - Collocation text (e.g., "make a decision")
 * - Meaning/Translation
 * - Audio pronunciation button
 *
 * Actions (Footer):
 * - Add/Remove from Word Bank
 * - Delete (if configured)
 *
 * Visuals:
 * - Badge showing the 'Day' number
 * - Accent mark for branding
 */
export default React.memo(function FaceSide({
  data,
  isDark,
  wordBankConfig,
  onFlip,
}: FaceSideProps) {
  // ============================================================================
  // Contexts & State
  // ============================================================================
  const { user } = useAuth();
  const { recordWordLearned } = useUserStatsStore();
  const { t } = useTranslation();

  // Local state for 'Add to Word Bank' operation
  const [isAdding, setIsAdding] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(
    wordBankConfig?.initialIsSaved ?? false,
  );

  // Sync initial 'saved' state when config changes (e.g., paging through cards)
  React.useEffect(() => {
    setIsAdded(wordBankConfig?.initialIsSaved ?? false);
  }, [wordBankConfig?.initialIsSaved]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Plays the audio pronunciation of the collocation using Expo Speech.
   */
  const speak = React.useCallback(() => {
    Speech.speak(data.collocation);
  }, [data.collocation]);

  // Determine permissions based on config
  const canAddToWordBank =
    wordBankConfig?.enableAdd !== false &&
    Boolean(wordBankConfig?.id) &&
    Boolean(wordBankConfig?.course);

  const canDelete =
    wordBankConfig?.enableDelete === true && Boolean(wordBankConfig?.onDelete);

  /**
   * Toggles the word's presence in the user's Word Bank.
   * Uses a Firestore transaction to ensure data integrity (deduplication).
   */
  const handleToggleWordBank = React.useCallback(async () => {
    if (!canAddToWordBank || !wordBankConfig) {
      return;
    }

    if (!user) {
      Alert.alert(t("common.error"), t("swipe.errors.loginRequired"));
      return;
    }

    setIsAdding(true);
    try {
      const wordRef = doc(
        db,
        "vocabank",
        user.uid,
        "course",
        wordBankConfig.course,
      );

      // Transaction: Read current words -> Check existence -> Add/Remove -> Write back
      const action = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(wordRef);
        const existingWords: SavedWord[] = snap.exists()
          ? snap.data().words || []
          : [];

        // Normalize away duplicates that may already exist in the array.
        const dedupedWords = Array.from(
          new Map(existingWords.map((word) => [word.id, word])).values(),
        );

        const existsInBank = dedupedWords.some(
          (word) => word.id === wordBankConfig.id,
        );

        // Scenario 1: Remove from Bank
        if (existsInBank) {
          const updatedWords = dedupedWords.filter(
            (word) => word.id !== wordBankConfig.id,
          );
          transaction.set(wordRef, { words: updatedWords }, { merge: true });
          return "removed" as const;
        }

        // Scenario 2: Add to Bank
        const newWord: SavedWord = {
          id: wordBankConfig.id,
          word: data.collocation,
          meaning: data.meaning,
          translation: data.translation || "",
          pronunciation: data.explanation || "",
          example: data.example,
          course: wordBankConfig.course,
          day: wordBankConfig.day,
          addedAt: new Date().toISOString(),
        };

        transaction.set(
          wordRef,
          { words: [...dedupedWords, newWord] },
          { merge: true },
        );
        return "added" as const;
      });

      // Handle UI updates based on transaction result
      if (action === "removed") {
        setIsAdded(false);
        wordBankConfig.onDelete?.(wordBankConfig.id);
        // Alert.alert(t("common.success"), "Removed from Word Bank.");
        return;
      }

      setIsAdded(true);
      await recordWordLearned(user.uid);
      // Alert.alert(
      //   t("common.success"),
      //   t("swipe.success.addedToWordBank", { word: data.collocation }),
      // );
    } catch (error) {
      console.error("Error toggling collocation word bank:", error);
      Alert.alert(t("common.error"), t("swipe.errors.addFailed"));
    } finally {
      setIsAdding(false);
    }
  }, [
    canAddToWordBank,
    data.collocation,
    data.example,
    data.explanation,
    data.meaning,
    data.translation,
    recordWordLearned,
    t,
    user,
    wordBankConfig,
  ]);

  /**
   * Action: Delete Word
   * Calls the parent's onDelete callback (used primarily in the Word Bank screen).
   */
  const handleDelete = React.useCallback(() => {
    if (!canDelete || !wordBankConfig?.onDelete || !wordBankConfig?.id) {
      return;
    }
    wordBankConfig.onDelete(wordBankConfig.id);
  }, [canDelete, wordBankConfig]);

  // ============================================================================
  // Main Render
  // ============================================================================
  return (
    <Pressable
      style={[styles.face, isDark && styles.faceDark]}
      onPress={onFlip}
      disabled={!onFlip}
    >
      {/* Visual Accent Mark (Top Right) */}
      <View style={styles.accentMark} />

      <View style={styles.contentContainer}>
        {/* Section: Day Badge */}
        {wordBankConfig?.day && (
          <View style={styles.dayBadgeContainer}>
            <Text style={[styles.dayBadge, isDark && styles.dayBadgeDark]}>
              Day {wordBankConfig.day}
            </Text>
          </View>
        )}

        {/* Section: Main Content (Word) */}
        <Text style={[styles.collocationText, isDark && styles.textDark]}>
          {data.collocation}
        </Text>

        {/* Section: Meaning & Audio */}
        <View style={styles.meaningContainer}>
          <Text style={[styles.meaningText, isDark && styles.textDark]}>
            {data.meaning}
          </Text>
          <TouchableOpacity onPress={speak} style={styles.speakerButton}>
            <Ionicons
              name="volume-medium"
              size={24}
              color={isDark ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section: Footer Actions (Word Bank / Delete) */}
      <View style={styles.footer}>
        {canAddToWordBank && (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              isAdded && styles.addButtonAdded,
              isAdding && styles.addButtonDisabled,
              !isAdded &&
                (isDark ? styles.addButtonDark : styles.addButtonLight),
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleToggleWordBank}
            disabled={isAdding}
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
                  ? "Added"
                  : t("swipe.actions.addToWordBank")}
            </Text>
          </Pressable>
        )}

        {canDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, isDark && styles.deleteButtonDark]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>
              {t("common.delete", { defaultValue: "Delete" })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  face: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  faceDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  dayBadgeContainer: {
    alignSelf: "center",
    marginBottom: 16,
  },
  dayBadge: {
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    color: "#007AFF",
    fontWeight: "600",
  },
  dayBadgeDark: {
    backgroundColor: "rgba(10, 132, 255, 0.2)",
    color: "#0a84ff",
  },
  meaningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    width: "100%",
  },
  speakerButton: {
    marginLeft: 8,
    padding: 4,
  },
  collocationText: {
    fontSize: 42,
    fontWeight: "700",
    textAlign: "center",
    color: "#111",
    lineHeight: 52,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.5,
  },
  meaningText: {
    fontSize: 22,
    fontWeight: "400",
    textAlign: "center",
    color: "#666",
    lineHeight: 30,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  textDark: {
    color: "#FFFFFF",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    minHeight: 52,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    gap: 8,
    borderWidth: 1,
  },
  addButtonLight: {
    backgroundColor: "#E8F4FD",
    borderColor: "#007AFF40",
  },
  addButtonDark: {
    backgroundColor: "#1c3a52",
    borderColor: "#0a84ff80",
  },
  addButtonAdded: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
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
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  deleteButtonDark: {
    backgroundColor: "rgba(255,59,48,0.16)",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
});

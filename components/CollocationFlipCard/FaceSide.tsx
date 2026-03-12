import { Ionicons } from "@expo/vector-icons";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useSpeech } from "../../src/hooks/useSpeech";
import { db } from "../../src/services/firebase";
import { useUserStatsStore } from "../../src/stores";
import { parseWordVariants, speakWordVariants } from "../../src/utils/wordVariants";
import { SavedWord } from "../wordbank/WordCard";
import { CollocationData, CollocationWordBankConfig } from "./types";

interface FaceSideProps {
  data: CollocationData;
  isDark: boolean;
  wordBankConfig?: CollocationWordBankConfig;
  onFlip?: () => void;
}

/**
 * Calculates dynamic font size based on text length to ensure single-row display
 * @param text - The collocation text to display
 * @returns Appropriate font size (between 24-42)
 */
const getDynamicFontSize = (text: string): number => {
  const { width } = Dimensions.get("window");
  const availableWidth = width * 0.8; // 80% of screen width (accounting for padding)
  const textLength = text.length;

  // Base font size
  const baseFontSize = 42;
  const minFontSize = 24;

  // Approximate character width ratio (adjusted for bold text)
  const charWidthRatio = 0.6;
  const estimatedWidth = textLength * baseFontSize * charWidthRatio;

  // If text fits at base size, use base size
  if (estimatedWidth <= availableWidth) {
    return baseFontSize;
  }

  // Calculate scaled font size
  const scaledFontSize = (availableWidth / (textLength * charWidthRatio));

  // Return font size clamped between min and base
  return Math.max(minFontSize, Math.min(baseFontSize, scaledFontSize));
};

/**
 * FaceSide Component for CollocationFlipCard
 *
 * Displays the "Front" of the flashcard.
 *
 * Main Content:
 * - Collocation text (e.g., "make a decision") with dynamic font sizing
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
  const { speak: speakText } = useSpeech();

  // Local state for 'Add to Word Bank' operation
  const [isAdding, setIsAdding] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(
    wordBankConfig?.initialIsSaved ?? false,
  );

  // Sync initial 'saved' state when config changes (e.g., paging through cards)
  React.useEffect(() => {
    setIsAdded(wordBankConfig?.initialIsSaved ?? false);
  }, [wordBankConfig?.initialIsSaved]);

  const collocationVariants = React.useMemo(
    () => parseWordVariants(data.collocation),
    [data.collocation],
  );
  const isMultiVariantCollocation = collocationVariants.length > 1;
  const longestVariant = React.useMemo(
    () =>
      collocationVariants.reduce(
        (longest, current) =>
          current.length > longest.length ? current : longest,
        collocationVariants[0] ?? data.collocation,
      ),
    [collocationVariants, data.collocation],
  );
  const isDeleteMode = wordBankConfig?.isDeleteMode === true;
  const isSelected = wordBankConfig?.isSelected === true;

  // Calculate dynamic font size based on collocation text length
  const dynamicFontSize = React.useMemo(() => {
    return getDynamicFontSize(longestVariant);
  }, [longestVariant]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Plays the audio pronunciation of the collocation using TTS.
   */
  const speak = React.useCallback(async () => {
    if (isDeleteMode) {
      return;
    }

    try {
      await speakWordVariants(data.collocation, speakText);
    } catch (error) {
      console.error("Collocation TTS error:", error);
    }
  }, [data.collocation, isDeleteMode, speakText]);

  // Determine permissions based on config
  const canAddToWordBank =
    wordBankConfig?.enableAdd !== false &&
    Boolean(wordBankConfig?.id) &&
    Boolean(wordBankConfig?.course);

  const canStartDeleteMode = Boolean(wordBankConfig?.onStartDeleteMode);
  const canToggleSelection = Boolean(wordBankConfig?.onToggleSelection);

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
        wordBankConfig.onSavedStateChange?.(wordBankConfig.id, false);
        wordBankConfig.onDelete?.(wordBankConfig.id);
        // Alert.alert(t("common.success"), "Removed from Word Bank.");
        return;
      }

      setIsAdded(true);
      wordBankConfig.onSavedStateChange?.(wordBankConfig.id, true);
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

  const handleStartDeleteMode = React.useCallback(() => {
    if (!wordBankConfig?.id) {
      return;
    }
    wordBankConfig.onStartDeleteMode?.(wordBankConfig.id);
  }, [wordBankConfig]);

  const handleToggleSelection = React.useCallback(() => {
    if (!wordBankConfig?.id) {
      return;
    }
    wordBankConfig.onToggleSelection?.(wordBankConfig.id);
  }, [wordBankConfig]);

  const handleCardPress = React.useCallback(() => {
    if (isDeleteMode) {
      handleToggleSelection();
      return;
    }
    onFlip?.();
  }, [handleToggleSelection, isDeleteMode, onFlip]);

  const renderCollocationText = () => {
    if (!isMultiVariantCollocation) {
      return (
        <Text
          style={[
            styles.collocationText,
            isDark && styles.textDark,
            { fontSize: dynamicFontSize },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {collocationVariants[0] ?? data.collocation}
        </Text>
      );
    }

    return (
      <View style={styles.collocationVariantsContainer}>
        {collocationVariants.map((variant, index) => (
          <Text
            key={`${variant}-${index}`}
            style={[
              styles.collocationText,
              styles.collocationTextVariant,
              isDark && styles.textDark,
              { fontSize: dynamicFontSize },
            ]}
          >
            {variant}
          </Text>
        ))}
      </View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================
  return (
    <Pressable
      style={[
        styles.face,
        isDark && styles.faceDark,
        isDeleteMode &&
          (isDark ? styles.faceDeleteModeDark : styles.faceDeleteModeLight),
        isSelected && (isDark ? styles.faceSelectedDark : styles.faceSelectedLight),
      ]}
      onPress={handleCardPress}
      onLongPress={handleStartDeleteMode}
      disabled={isDeleteMode ? !canToggleSelection && !canStartDeleteMode : !onFlip && !canStartDeleteMode}
    >
      {isDeleteMode ? (
        <View
          style={[
            styles.selectionBadge,
            isSelected
              ? styles.selectionBadgeSelected
              : isDark
                ? styles.selectionBadgeIdleDark
                : styles.selectionBadgeIdleLight,
          ]}
        >
          <Ionicons
            name={isSelected ? "checkmark" : "ellipse-outline"}
            size={16}
            color={isSelected ? "#fff" : isDark ? "#fff" : "#666"}
          />
        </View>
      ) : null}

      {/* Bookmark button (top-right corner) */}
      {canAddToWordBank && !isDeleteMode && (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            isAdded && styles.addButtonAdded,
            isAdding && styles.addButtonDisabled,
            !isAdded && (isDark ? styles.addButtonDark : styles.addButtonLight),
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleToggleWordBank}
          disabled={isAdding}
        >
          <Ionicons
            name={isAdded ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isAdded ? "#fff" : isDark ? "#0a84ff" : "#007AFF"}
          />
        </Pressable>
      )}

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
        {/* Collocation Text */}
        {isDeleteMode ? (
          <View>{renderCollocationText()}</View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              void speak();
            }}
            onLongPress={handleStartDeleteMode}
            activeOpacity={0.7}
          >
            {renderCollocationText()}
          </TouchableOpacity>
        )}

        {/* Section: Meaning & Audio */}
        <View style={styles.meaningContainer}>
          <View style={styles.meaningTextContainer}>
            {data.meaning.length >= 10
              ? data.meaning.split(',').map((part, index) => (
                  <Text
                    key={index}
                    style={[styles.meaningText, isDark && styles.textDark]}
                  >
                    {part.trim()}
                  </Text>
                ))
              : <Text style={[styles.meaningText, isDark && styles.textDark]}>
                  {data.meaning}
                </Text>
            }
          </View>
        </View>
      </View>

      <View style={styles.footer} />
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
  faceDeleteModeLight: {
    borderColor: "#d0d0d0",
  },
  faceDeleteModeDark: {
    borderColor: "#3a3a3c",
  },
  faceSelectedLight: {
    borderColor: "#007AFF",
    backgroundColor: "#F1F7FF",
  },
  faceSelectedDark: {
    borderColor: "#0A84FF",
    backgroundColor: "#162331",
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
  meaningTextContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
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
  collocationVariantsContainer: {
    gap: 6,
  },
  collocationTextVariant: {
    lineHeight: 46,
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
  selectionBadge: {
    position: "absolute",
    top: 28,
    left: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    zIndex: 2,
  },
  selectionBadgeSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  selectionBadgeIdleLight: {
    backgroundColor: "#fff",
    borderColor: "#c7c7cc",
  },
  selectionBadgeIdleDark: {
    backgroundColor: "#2c2c2e",
    borderColor: "#636366",
  },
  addButton: {
    position: "absolute",
    top: 28,
    right: 28,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
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
});

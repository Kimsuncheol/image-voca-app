import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSpeech } from "../../src/hooks/useSpeech";
import {
  parseWordVariants,
  speakWordVariants,
} from "../../src/utils/wordVariants";
import { CollocationCardImage } from "../common/CollocationCardImage";
import { DayBadge } from "../common/DayBadge";
import { AddToWordBankButton } from "../wordbank/AddToWordBankButton";
import { SavedWord } from "../wordbank/WordCard";
import { CollocationData, CollocationWordBankConfig } from "./types";

interface FaceSideProps {
  data: CollocationData;
  isDark: boolean;
  wordBankConfig?: CollocationWordBankConfig;
  onFlip?: () => void;
  onImageLoad?: () => void;
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
  const baseFontSize = 36;
  const minFontSize = 24;

  // Approximate character width ratio (adjusted for bold text)
  const charWidthRatio = 0.6;
  const estimatedWidth = textLength * baseFontSize * charWidthRatio;

  // If text fits at base size, use base size
  if (estimatedWidth <= availableWidth) {
    return baseFontSize;
  }

  // Calculate scaled font size
  const scaledFontSize = availableWidth / (textLength * charWidthRatio);

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
  onImageLoad,
}: FaceSideProps) {
  // ============================================================================
  // Contexts & State
  // ============================================================================
  const { speak: speakText } = useSpeech();

  React.useEffect(() => {
    if (!data.imageUrl) onImageLoad?.();
  }, [data.imageUrl, onImageLoad]);

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
        isSelected &&
          (isDark ? styles.faceSelectedDark : styles.faceSelectedLight),
      ]}
      onPress={handleCardPress}
      onLongPress={handleStartDeleteMode}
      disabled={
        isDeleteMode
          ? !canToggleSelection && !canStartDeleteMode
          : !onFlip && !canStartDeleteMode
      }
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
        <View style={styles.topRightOverlay}>
          <AddToWordBankButton
            itemId={wordBankConfig!.id}
            course={wordBankConfig!.course}
            isDark={isDark}
            initialIsSaved={wordBankConfig?.initialIsSaved ?? false}
            onSavedStateChange={wordBankConfig?.onSavedStateChange}
            onRemoved={wordBankConfig?.onDelete}
            variant="star"
            buildSavedWord={() =>
              ({
                id: wordBankConfig!.id,
                word: data.collocation,
                meaning: data.meaning,
                translation: data.translation || "",
                pronunciation: data.explanation || "",
                example: data.example,
                course: wordBankConfig!.course,
                day: wordBankConfig?.day,
                addedAt: new Date().toISOString(),
              }) as SavedWord
            }
          />
        </View>
      )}

      <View style={styles.contentContainer}>
        {/* Section: Image */}
        <CollocationCardImage
          imageUrl={data.imageUrl}
          isDark={isDark}
          style={styles.cardImage}
          onImageLoad={onImageLoad}
        />

        <View style={styles.textContainer}>
          {/* Top Row: Collocation + Day Badge */}
          <View style={styles.collocationRow}>
            <View style={styles.collocationWrapper}>
              {/* Section: Collocation Text */}
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
            </View>

            {/* Section: Day chip */}
            {wordBankConfig?.day !== undefined && (
              <View style={styles.dayBadgeContainerRow}>
                <DayBadge day={wordBankConfig.day} isDark={isDark} />
              </View>
            )}
          </View>

          {/* Section: Meaning */}
          <View style={styles.meaningContainer}>
            <View style={styles.meaningTextContainer}>
              {data.meaning.length >= 10 ? (
                data.meaning.split(",").map((part, index) => (
                  <Text
                    key={index}
                    style={[styles.meaningText, isDark && styles.textDark]}
                  >
                    {part.trim()}
                  </Text>
                ))
              ) : (
                <Text style={[styles.meaningText, isDark && styles.textDark]}>
                  {data.meaning}
                </Text>
              )}
            </View>
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
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  textContainer: {
    flex: 6,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 24,
    paddingHorizontal: 16,
    gap: 8,
    width: "100%",
  },
  collocationRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  collocationWrapper: {
    flex: 1,
    alignItems: "flex-start",
  },
  dayBadgeContainerRow: {
    flexShrink: 0,
  },
  meaningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  meaningTextContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 4,
  },
  collocationText: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "left",
    color: "#111",
    lineHeight: 56,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: -0.5,
  },
  collocationVariantsContainer: {
    gap: 6,
  },
  collocationTextVariant: {
    lineHeight: 50,
  },
  meaningText: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "left",
    color: "#666",
    lineHeight: 26,
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
  topRightOverlay: {
    position: "absolute",
    top: 28,
    right: 28,
    zIndex: 3,
  },
  cardImage: {
    flex: 4,
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
});

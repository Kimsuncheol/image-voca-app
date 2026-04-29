import { CARD_HEIGHT } from "@/src/constants/layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Pressable,
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
import { AddToWordBankButton } from "../wordbank/AddToWordBankButton";
import { SavedWord } from "../wordbank/WordCard";
import { CollocationData, CollocationWordBankConfig } from "./types";
import { styles } from "./EnglishCollocationCardStyle";

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
            styles.faceCollocationText,
            isDark && styles.faceTextDark,
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
      <View style={styles.faceCollocationVariantsContainer}>
        {collocationVariants.map((variant, index) => (
          <Text
            key={`${variant}-${index}`}
            style={[
              styles.faceCollocationText,
              styles.faceCollocationTextVariant,
              isDark && styles.faceTextDark,
              { fontSize: dynamicFontSize },
            ]}
          >
            {variant} {CARD_HEIGHT}
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
            styles.faceSelectionBadge,
            isSelected
              ? styles.faceSelectionBadgeSelected
              : isDark
                ? styles.faceSelectionBadgeIdleDark
                : styles.faceSelectionBadgeIdleLight,
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
        <View style={styles.faceTopRightOverlay}>
          <AddToWordBankButton
            itemId={wordBankConfig!.id}
            course={wordBankConfig!.course}
            isDark={isDark}
            initialIsSaved={wordBankConfig?.initialIsSaved ?? false}
            onSavedStateChange={wordBankConfig?.onSavedStateChange}
            onRemoved={wordBankConfig?.onDelete}
            variant="bookmark"
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

      <View style={styles.faceContentContainer}>
        {/* Section: Image */}
        <CollocationCardImage
          imageUrl={data.imageUrl}
          isDark={isDark}
          style={styles.faceCardImage}
          onImageLoad={onImageLoad}
        />

        <View style={styles.faceTextContainer}>
          {/* Top Row: Collocation + Day Badge */}
          <View style={styles.faceCollocationRow}>
            <View style={styles.faceCollocationWrapper}>
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
              <View style={styles.faceDayBadgeContainerRow}>
                <View style={{
                  minHeight: 32,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(22,34,49,0.88)",
                  borderWidth: 0.5,
                  borderColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}>
                  <Text style={{
                    color: "#F8F8F8",
                    fontSize: 16,
                    fontWeight: "700",
                  }}>
                    Day {wordBankConfig.day}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Section: Meaning */}
          <View style={styles.faceMeaningContainer}>
            <View style={styles.faceMeaningTextContainer}>
              {data.meaning.length >= 10 ? (
                data.meaning.split(",").map((part, index) => (
                  <Text
                    key={index}
                    style={[styles.faceMeaningText, isDark && styles.faceTextDark]}
                  >
                    {part.trim()}
                  </Text>
                ))
              ) : (
                <Text style={[styles.faceMeaningText, isDark && styles.faceTextDark]}>
                  {data.meaning}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.faceFooter} />
    </Pressable>
  );
});

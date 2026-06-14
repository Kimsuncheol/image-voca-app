import React from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getBackgroundColors } from "../../constants/backgroundColors";
import type { ReviewMaskTarget } from "../../src/services/speechPreferences";
import { useTheme } from "../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { VocabularyCard } from "../../src/types/vocabulary";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
import { MaskVisibilityToggle } from "../common/MaskVisibilityToggle";
import { SwipeCardItemAddToWordBankButton } from "./SwipeCardItemAddToWordBankButton";
import { SwipeCardItemCardInfoSection } from "./SwipeCardItemCardInfoSection";
import { SwipeCardItemImageSection } from "./SwipeCardItemImageSection";

const { width } = Dimensions.get("window");

interface SwipeCardItemProps {
  item: VocabularyCard;
  initialIsSaved?: boolean;
  day?: number;
  isActive?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isPreviewMode?: boolean;
  isReviewMode?: boolean;
  reviewMaskTarget?: ReviewMaskTarget;
  onMaskChange?: (enabled: boolean) => void;
}

export function SwipeCardItem({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
  isPreviewMode = false,
  isReviewMode = false,
  reviewMaskTarget = "word",
  onMaskChange,
}: SwipeCardItemProps) {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const { i18n } = useTranslation();
  const contentScrollRef = React.useRef<ScrollView>(null);
  const resetScrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousIsActiveRef = React.useRef(isActive);
  useCardSpeechCleanup(isActive);
  const resolved = React.useMemo(
    () => resolveVocabularyContent(item, i18n.language),
    [i18n.language, item],
  );

  React.useEffect(() => {
    if (resetScrollTimeoutRef.current) {
      clearTimeout(resetScrollTimeoutRef.current);
      resetScrollTimeoutRef.current = null;
    }

    const wasActive = previousIsActiveRef.current;
    previousIsActiveRef.current = isActive;

    if (wasActive && !isActive) {
      resetScrollTimeoutRef.current = setTimeout(() => {
        contentScrollRef.current?.scrollTo({ y: 0, animated: false });
        resetScrollTimeoutRef.current = null;
      }, 500);
    }

    return () => {
      if (resetScrollTimeoutRef.current) {
        clearTimeout(resetScrollTimeoutRef.current);
        resetScrollTimeoutRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgColors.learningCardSurface },
      ]}
    >
      <SwipeCardItemImageSection
        imageUrl={item.imageUrl}
        isDark={isDark}
        topRightOverlay={
          !isPreviewMode ? (
            <SwipeCardItemAddToWordBankButton
              item={item}
              isDark={isDark}
              initialIsSaved={initialIsSaved}
              day={day}
              onSavedWordChange={onSavedWordChange}
            />
          ) : null
        }
      />

      <ScrollView
        ref={contentScrollRef}
        testID="swipe-card-content-scroll"
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <SwipeCardItemCardInfoSection
          item={item}
          pronunciation={resolved.sharedPronunciation}
          localizedPronunciation={
            resolved.localizedPronunciation !== resolved.sharedPronunciation
              ? resolved.localizedPronunciation
              : undefined
          }
          word={resolved.word}
          meaning={resolved.meaning}
          example={resolved.example}
          translation={resolved.translation}
          synonyms={item.synonyms}
          courseId={item.course}
          isDark={isDark}
          isActive={isActive}
          isReviewMode={isReviewMode}
          reviewMaskTarget={reviewMaskTarget}
        />
      </ScrollView>

      <View testID="swipe-card-mask-toggle-row" style={styles.maskToggleRow}>
        <MaskVisibilityToggle
          isDark={isDark}
          isMaskEnabled={isReviewMode}
          onMaskChange={onMaskChange ?? (() => {})}
          testID="swipe-card-mask-toggle"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden",
  },
  contentScroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingBottom: 8,
  },
  maskToggleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
});

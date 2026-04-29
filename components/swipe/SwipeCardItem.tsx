import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { VocabularyCard } from "../../src/types/vocabulary";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
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
}

export function SwipeCardItem({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
  isPreviewMode = false,
}: SwipeCardItemProps) {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const { i18n } = useTranslation();
  useCardSpeechCleanup(isActive);
  const resolved = React.useMemo(
    () => resolveVocabularyContent(item, i18n.language),
    [i18n.language, item],
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgColors.learningCardSurface },
      ]}
    >
      {/* Image Section */}
      <SwipeCardItemImageSection
        imageUrl={item.imageUrl}
        isDark={isDark}
      />

      {/* Card Info Section */}
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
        initialIsSaved={initialIsSaved}
        day={day}
        onSavedWordChange={onSavedWordChange}
        isPreviewMode={isPreviewMode}
      />
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
});

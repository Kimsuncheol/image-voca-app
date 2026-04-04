import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../src/hooks/useCardSpeechCleanup";
import { VocabularyCard } from "../../src/types/vocabulary";
import { resolveVocabularyContent } from "../../src/utils/localizedVocabulary";
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
}

export function SwipeCardItem({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
}: SwipeCardItemProps) {
  const { isDark } = useTheme();
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
        { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        { borderColor: isDark ? "#333" : "#E0E0E0" },
      ]}
    >
      {/* Image Section */}
      <SwipeCardItemImageSection
        imageUrl={item.imageUrl}
        isDark={isDark}
        topRightOverlay={
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved}
            day={day}
            onSavedWordChange={onSavedWordChange}
          />
        }
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
});

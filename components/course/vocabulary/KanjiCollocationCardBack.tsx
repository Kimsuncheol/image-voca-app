import React from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import type { KanjiWord } from "../../../src/types/vocabulary";
import { BackSection } from "./KanjiCollocationCardBackSection";
import { GeneralBackSection } from "./KanjiCollocationCardGeneralBackSection";
import { DottedDivider } from "./KanjiCollocationCardDivider";
import { styles } from "./KanjiCollocationCardStyles";

/**
 * Props passed to the back face component of the Kanji Collocation Card.
 */
export interface BackSideProps {
  /** The specific vocabulary word (Kanji) object containing meaning/reading details */
  item: KanjiWord;
  /** Whether dark mode is enabled */
  isDark: boolean;
  /** Whether the card is currently active/visible on the screen to process TTS operations */
  isActive: boolean;
  /** Current app language used to choose localized meaning/reading labels */
  language?: string;
  /** Whether the user speaks Korean. Used to toggle dynamically between Korean/English translations. */
  useKorean: boolean;
  /** Whether the card should hide review targets under tape masks */
  isReviewMode?: boolean;
  /** Callback triggered when the mask visibility is changed */
  onMaskChange?: (enabled: boolean) => void;
  /** Callback triggered to flip the card horizontally back to the front face */
  onFlip: () => void;
}

/**
 * BackSide
 * 
 * The back face of the FlipCard component. It contains a scrollable view displaying
 * detailed collocations, grouped meanings, readings, Japanese usages, and example sentences.
 * It also holds the "がな" (Furigana) toggle button to show or hide reading aids.
 */
export function BackSide({
  item,
  isDark,
  isActive,
  language,
  useKorean,
  isReviewMode = false,
  onMaskChange = () => {},
  onFlip,
}: BackSideProps) {
  const { t } = useTranslation();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const meanings = item.meaning;
  const readings = item.reading;
  const meaningTranslations = useKorean ? item.meaningKoreanTranslation : item.meaningEnglishTranslation;
  const readingTranslations = useKorean ? item.readingKoreanTranslation : item.readingEnglishTranslation;
  const exampleTranslations = useKorean ? item.exampleKoreanTranslation : item.exampleEnglishTranslation;
  const hasMeaningSection = meanings.some((value) => value.trim().length > 0);
  const hasReadingSection = readings.some((value) => value.trim().length > 0);
  const hasExampleSection = item.example.some((value) => value.trim().length > 0);

  const [showFurigana, setShowFurigana] = React.useState(false);

  React.useEffect(() => {
    if (!isActive) setShowFurigana(false);
  }, [isActive]);

  const handleMaskChange = React.useCallback(
    (event: GestureResponderEvent, enabled: boolean) => {
      event?.stopPropagation();
      onMaskChange(enabled);
    },
    [onMaskChange],
  );

  const handleToggleFurigana = React.useCallback(
    (event: GestureResponderEvent) => {
      event?.stopPropagation();
      setShowFurigana((v) => !v);
    },
    [],
  );

  return (
    <Pressable
      testID="kanji-collocation-back-side"
      style={[
        styles.back,
        {
          backgroundColor: bgColors.learningCardSurface,
          borderColor: bgColors.learningCardSurface,
        },
      ]}
      onPress={onFlip}
    >
      <View testID="kanji-collocation-back-control-row" style={styles.backHeader}>
        <View
          testID="kanji-collocation-back-mask-toggle"
          style={[
            styles.backMaskToggleGroup,
            {
              backgroundColor: bgColors.learningCardSurfaceAlt,
              borderColor: fontColors.learningCardDividerMuted,
            },
          ]}
        >
          {([true, false] as const).map((enabled) => {
            const isSelected = isReviewMode === enabled;
            const labelKey = enabled ? "course.mask" : "course.show";
            const defaultValue = enabled ? "Mask" : "Show";

            return (
              <TouchableOpacity
                key={labelKey}
                testID={
                  enabled
                    ? "kanji-collocation-back-mask-toggle-mask"
                    : "kanji-collocation-back-mask-toggle-show"
                }
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={(event) => handleMaskChange(event, enabled)}
                activeOpacity={0.78}
                style={[
                  styles.backMaskToggleSegment,
                  {
                    backgroundColor: isSelected
                      ? bgColors.learningCardSurface
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.backMaskToggleText,
                    {
                      color: isSelected
                        ? fontColors.learningCardPrimary
                        : fontColors.learningCardMuted,
                    },
                  ]}
                >
                  {t(labelKey, { defaultValue })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          testID="kanji-collocation-furigana-toggle"
          onPress={handleToggleFurigana}
          activeOpacity={0.7}
          style={[
            styles.furiganaButton,
            showFurigana
              ? { backgroundColor: bgColors.learningCardKanaActive }
              : {
                  borderColor: fontColors.learningCardDividerMuted,
                  borderWidth: 1,
                },
          ]}
        >
          <Text
            style={[
              styles.furiganaButtonText,
              {
                color: showFurigana
                  ? fontColors.inverse
                  : fontColors.learningCardMuted,
              },
            ]}
          >
            がな
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.backScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <Pressable
          testID="kanji-collocation-back-scroll-background"
          onPress={onFlip}
          style={styles.backScrollContent}
        >
          <View
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => true}
          >
            {hasMeaningSection ? (
              <BackSection
                title="MEANING"
                values={meanings}
                examples={item.meaningExample}
                hurigana={item.meaningExampleHurigana}
                translations={meaningTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
                isReviewMode={isReviewMode}
                onFlip={onFlip}
              />
            ) : null}
            {hasMeaningSection && hasReadingSection ? (
              <Pressable onPress={(e) => { e?.stopPropagation(); onFlip(); }}>
                <DottedDivider
                  isDark={isDark}
                  testID="kanji-collocation-divider-meaning-reading"
                />
              </Pressable>
            ) : null}
            {hasReadingSection ? (
              <BackSection
                title="READING"
                values={readings}
                examples={item.readingExample}
                hurigana={item.readingExampleHurigana}
                translations={readingTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
                isReviewMode={isReviewMode}
                onFlip={onFlip}
              />
            ) : null}
            {hasReadingSection && hasExampleSection ? (
              <Pressable onPress={(e) => { e?.stopPropagation(); onFlip(); }}>
                <DottedDivider
                  isDark={isDark}
                  testID="kanji-collocation-divider-reading-example"
                />
              </Pressable>
            ) : null}
            {hasExampleSection ? (
              <GeneralBackSection
                examples={item.example}
                hurigana={item.exampleHurigana}
                translations={exampleTranslations}
                isDark={isDark}
                isActive={isActive}
                showFurigana={showFurigana}
                isReviewMode={isReviewMode}
                onFlip={onFlip}
              />
            ) : null}
          </View>
        </Pressable>
      </ScrollView>
    </Pressable>
  );
}

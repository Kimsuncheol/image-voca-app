import React from "react";
import { FontSizes } from "@/constants/fontSizes";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { getFontColors } from "../../../constants/fontColors";
import { useSpeech } from "../../../src/hooks/useSpeech";
import type { KanjiWord } from "../../../src/types/vocabulary";
import {
  buildKanjiMeaningDisplayRows,
  buildKanjiReadingDisplayRows,
} from "../../../src/utils/kanjiDisplayRows";
import { CollocationCardImage } from "../../common/CollocationCardImage";
import { DayBadge } from "../../common/DayBadge";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { DottedDivider } from "./KanjiCollocationCardDivider";
import { styles } from "./KanjiCollocationCardStyles";

/**
 * Props passed to the front face component of the Kanji Collocation Card.
 */
export interface FaceSideProps {
  /** The specific vocabulary word (Kanji) object to be displayed */
  item: KanjiWord;
  /** Whether dark mode is enabled */
  isDark: boolean;
  /** Whether the card is currently active/visible on the screen to process TTS operations */
  isActive: boolean;
  /** Current app language used to choose localized meaning/reading labels */
  language?: string;
  /** The day integer identifier associated with the word (used for indexing in DayBadge) */
  day?: number;
  /** Whether the word is initially tagged as saved in the user's wordbank */
  initialIsSaved?: boolean;
  /** Callback triggered when the word is successfully added or removed from the saved wordbank */
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  /** Whether the card is rendered in read-only preview mode */
  isPreviewMode?: boolean;
  /** Callback triggered to flip the card horizontally to the back */
  onFlip: () => void;
}

/**
 * FaceSide
 *
 * The front face of the FlipCard component. It prominently displays the target `Kanji`
 * and brief summarized labels of its meaning and reading. Provides interaction endpoints
 * such as TTS voice playback natively on click and flipping the card over.
 */
export function FaceSide({
  item,
  isDark,
  isActive,
  day,
  initialIsSaved,
  onSavedWordChange,
  isPreviewMode = false,
  onFlip,
  language = "en",
}: FaceSideProps) {
  const { speak } = useSpeech();
  const fontColors = getFontColors(isDark);

  const handleSpeakItem = React.useCallback(
    (text: string) => {
      if (!isActive) return;
      void speak(text, { language: "ja-JP" });
    },
    [isActive, speak],
  );

  const meanings = buildKanjiMeaningDisplayRows(item, language);
  const readings = buildKanjiReadingDisplayRows(item, language);

  const handlePressSpeechItem = React.useCallback(
    (event: GestureResponderEvent | undefined, text: string) => {
      event?.stopPropagation();
      handleSpeakItem(text);
    },
    [handleSpeakItem],
  );

  return (
    <Pressable
      testID="kanji-collocation-face-side"
      style={[
        styles.face,
        {
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderColor: isDark ? "#333" : "#E0E0E0",
        },
      ]}
      onPress={onFlip}
    >
      <View style={styles.imageContainer}>
        <CollocationCardImage
          imageUrl={item.imageUrl}
          isDark={isDark}
          style={styles.cardImage}
        />
        {!isPreviewMode && (
          <View style={styles.imageTopRightOverlay}>
            <SwipeCardItemAddToWordBankButton
              item={item}
              isDark={isDark}
              initialIsSaved={initialIsSaved ?? false}
              day={day}
              onSavedWordChange={onSavedWordChange}
            />
          </View>
        )}
      </View>

      <View style={styles.faceInnerContainer}>
        <View style={styles.faceContent}>
          <View style={styles.kanjiSectionRow}>
            <Text
              style={[styles.kanjiText, { color: fontColors.primary }]}
            >
              {item.kanji}
            </Text>
            {day !== undefined && <DayBadge day={day} />}
          </View>

          {meanings.length > 0 && (
            <View style={styles.faceSection}>
              <Text
                style={[
                  styles.faceSectionLabel,
                  { color: fontColors.muted },
                ]}
              >
                MEANING
              </Text>
              <View style={styles.faceChipRow}>
                {meanings.map((m, i) => (
                  <View
                    key={`meaning-${i}`}
                    testID={`kanji-collocation-face-meaning-${i}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 24,
                    }}
                  >
                    {m.localizedText ? (
                      <Text
                        style={[
                          styles.faceListItem,
                          { color: fontColors.subtle, fontSize: FontSizes.body },
                        ]}
                      >
                        {m.localizedText}
                      </Text>
                    ) : null}
                    {m.baseText ? (
                      <Pressable
                        testID={`kanji-collocation-face-meaning-speak-${i}`}
                        onPress={(event) =>
                          handlePressSpeechItem(event, m.speakText)
                        }
                      >
                        <Text
                          style={[
                            styles.faceListItem,
                            { color: fontColors.secondary },
                          ]}
                        >
                          {m.baseText}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {meanings.length > 0 && readings.length > 0 && (
            <DottedDivider isDark={isDark} />
          )}
          {readings.length > 0 && (
            <View style={styles.faceSection}>
              <Text
                style={[
                  styles.faceSectionLabel,
                  { color: fontColors.muted },
                ]}
              >
                READING
              </Text>
              <View style={styles.faceChipRow}>
                {readings.map((r, i) => (
                  <View
                    key={`reading-${i}`}
                    testID={`kanji-collocation-face-reading-${i}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: 24,
                    }}
                  >
                    {r.localizedText ? (
                      <Text
                        style={[
                          styles.faceListItem,
                          { color: fontColors.subtle, fontSize: FontSizes.body },
                        ]}
                      >
                        {r.localizedText}
                      </Text>
                    ) : null}
                    {r.baseText ? (
                      <Pressable
                        testID={`kanji-collocation-face-reading-speak-${i}`}
                        onPress={(event) =>
                          handlePressSpeechItem(event, r.speakText)
                        }
                      >
                        <Text
                          style={[
                            styles.faceListItem,
                            { color: fontColors.secondary },
                          ]}
                        >
                          {r.baseText}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

import React from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSpeech } from "../../../src/hooks/useSpeech";
import type { KanjiWord } from "../../../src/types/vocabulary";
import { CollocationCardImage } from "../../common/CollocationCardImage";
import { DayBadge } from "../../common/DayBadge";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";
import { DottedDivider } from "./KanjiCollocationCardDivider";
import { styles } from "./KanjiCollocationCardStyles";
import { compactStrings } from "./kanjiCollocationUtils";

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
  /** The day integer identifier associated with the word (used for indexing in DayBadge) */
  day?: number;
  /** Whether the word is initially tagged as saved in the user's wordbank */
  initialIsSaved?: boolean;
  /** Callback triggered when the word is successfully added or removed from the saved wordbank */
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
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
  onFlip,
}: FaceSideProps) {
  const { speak } = useSpeech();

  const handleSpeakKanji = React.useCallback(() => {
    if (!isActive) return;
    void speak(item.kanji, { language: "ja-JP" });
  }, [isActive, item.kanji, speak]);

  const meanings = compactStrings(item.meaning);
  const readings = compactStrings(item.reading);

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
        <View style={styles.imageTopRightOverlay}>
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved ?? false}
            day={day}
            onSavedWordChange={onSavedWordChange}
          />
        </View>
      </View>

      <View style={styles.faceInnerContainer}>
        <View style={styles.faceContent}>
        <View style={styles.kanjiSectionRow}>
          <TouchableOpacity onPress={handleSpeakKanji} activeOpacity={0.7}>
            <Text
              style={[styles.kanjiText, { color: isDark ? "#fff" : "#1a1a1a" }]}
            >
              {item.kanji}
            </Text>
          </TouchableOpacity>
          {day !== undefined && <DayBadge day={day} />}
        </View>

        {meanings.length > 0 && (
          <View
            style={styles.faceSection}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.faceSectionLabel,
                { color: isDark ? "#999" : "#666" },
              ]}
            >
              MEANING
            </Text>
            <View style={styles.faceChipRow}>
              {meanings.map((m, i) => (
                <Text
                  key={`meaning-${i}`}
                  style={[
                    styles.faceListItem,
                    { color: isDark ? "#e0e0e0" : "#1a1a1a" },
                  ]}
                >
                  {m}
                  {i < meanings.length - 1 ? "," : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {meanings.length > 0 && readings.length > 0 && (
          <DottedDivider isDark={isDark} />
        )}
        {readings.length > 0 && (
          <View
            style={styles.faceSection}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.faceSectionLabel,
                { color: isDark ? "#999" : "#666" },
              ]}
            >
              READING
            </Text>
            <View style={styles.faceChipRow}>
              {readings.map((r, i) => (
                <Text
                  key={`reading-${i}`}
                  style={[
                    styles.faceListItem,
                    { color: isDark ? "#e0e0e0" : "#1a1a1a" },
                  ]}
                >
                  {r}
                  {i < readings.length - 1 ? "," : ""}
                </Text>
              ))}
            </View>
          </View>
        )}
        </View>
      </View>
    </Pressable>
  );
}

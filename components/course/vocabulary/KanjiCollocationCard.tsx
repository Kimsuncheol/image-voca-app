import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FlipCard from "react-native-flip-card";
import { useTheme } from "../../../src/context/ThemeContext";
import { useCardSpeechCleanup } from "../../../src/hooks/useCardSpeechCleanup";
import { useSpeech } from "../../../src/hooks/useSpeech";
import type { KanjiNestedListGroup, KanjiWord } from "../../../src/types/vocabulary";
import {
  splitJapaneseTextSegments,
  stripKanaParens,
} from "../../../src/utils/japaneseText";
import { DayBadge } from "../../common/DayBadge";
import { SwipeCardItemAddToWordBankButton } from "../../swipe/SwipeCardItemAddToWordBankButton";

const { width } = Dimensions.get("window");

interface KanjiCollocationCardProps {
  item: KanjiWord;
  initialIsSaved?: boolean;
  day?: number;
  isActive?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

const compactStrings = (values?: string[]) =>
  values?.map((v) => v.trim()).filter(Boolean) ?? [];

const trimmedStringAt = (values: string[], index: number) => {
  const trimmed = values[index]?.trim();
  return trimmed ? trimmed : undefined;
};

const itemsAt = (groups: KanjiNestedListGroup[], index: number) =>
  compactStrings(groups[index]?.items);

// ─── Face Side ───────────────────────────────────────────────────────────────

interface FaceSideProps {
  item: KanjiWord;
  isDark: boolean;
  isActive: boolean;
  day?: number;
  initialIsSaved?: boolean;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onFlip: () => void;
}

function FaceSide({
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
      style={[styles.face, { backgroundColor: isDark ? "#1a1a1a" : "#fff", borderColor: isDark ? "#333" : "#E0E0E0" }]}
      onPress={onFlip}
    >
      <View style={styles.faceTopRow}>
        {day !== undefined && <DayBadge day={day} isDark={isDark} />}
        <View style={styles.faceTopRowRight}>
          <SwipeCardItemAddToWordBankButton
            item={item}
            isDark={isDark}
            initialIsSaved={initialIsSaved ?? false}
            day={day}
            onSavedWordChange={onSavedWordChange}
          />
        </View>
      </View>

      <View style={styles.faceContent}>
        <TouchableOpacity onPress={handleSpeakKanji} activeOpacity={0.7}>
          <Text style={[styles.kanjiText, { color: isDark ? "#fff" : "#1a1a1a" }]}>
            {item.kanji}
          </Text>
        </TouchableOpacity>

        {meanings.length > 0 && (
          <View style={styles.faceSection}>
            <Text style={[styles.faceSectionLabel, { color: isDark ? "#999" : "#666" }]}>
              MEANING
            </Text>
            <View style={styles.faceChipRow}>
              {meanings.map((m, i) => (
                <Text key={`meaning-${i}`} style={[styles.faceListItem, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
                  {m}{i < meanings.length - 1 ? "," : ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {meanings.length > 0 && readings.length > 0 && <DottedDivider isDark={isDark} />}
        {readings.length > 0 && (
          <View style={styles.faceSection}>
            <Text style={[styles.faceSectionLabel, { color: isDark ? "#999" : "#666" }]}>
              READING
            </Text>
            <View style={styles.faceChipRow}>
              {readings.map((r, i) => (
                <Text key={`reading-${i}`} style={[styles.faceListItem, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
                  {r}{i < readings.length - 1 ? "," : ""}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Back Side ────────────────────────────────────────────────────────────────

interface BackSectionProps {
  title: string;
  values: string[];
  examples: KanjiNestedListGroup[];
  hurigana: KanjiNestedListGroup[];
  translations: KanjiNestedListGroup[];
  isDark: boolean;
  isActive: boolean;
  showFurigana: boolean;
}

function BackSection({
  title,
  values,
  examples,
  hurigana,
  translations,
  isDark,
  isActive,
  showFurigana,
}: BackSectionProps) {
  const { speak } = useSpeech();

  const entries = values
    .map((value, index) => ({
      value: value.trim(),
      examples: itemsAt(examples, index),
      hurigana: itemsAt(hurigana, index),
      translations: itemsAt(translations, index),
    }))
    .filter((e) => e.value);

  const handleSpeak = React.useCallback(
    (text: string) => {
      if (!isActive) return;
      void speak(text, { language: "ja-JP" });
    },
    [isActive, speak],
  );

  if (entries.length === 0) return null;

  return (
    <View style={styles.backSection}>
      <Text style={[styles.backSectionTitle, { color: isDark ? "#999" : "#666" }]}>
        {title}
      </Text>
      {entries.map((entry, i) => (
        <View key={`${title}-${i}`} style={styles.backGroup}>
          <Text style={[styles.backGroupLabel, { color: isDark ? "#fff" : "#1a1a1a" }]}>
            {entry.value}
          </Text>
          <View style={styles.backPairsContainer}>
            {entry.examples.map((example, j) => (
              <TouchableOpacity
                key={`${title}-${i}-ex-${j}`}
                onPress={() => handleSpeak(entry.hurigana[j] ?? example)}
                activeOpacity={0.7}
                style={styles.backPairItem}
              >
                <View
                  testID={`kanji-collocation-${title.toLowerCase()}-main-row-${i}-${j}`}
                  style={styles.backPairMainRow}
                >
                  <Text style={[styles.backExample, { color: isDark ? "#aaa" : "#555" }]}>
                    {example}
                  </Text>
                  {entry.translations[j] ? (
                    <Text style={[styles.backTranslation, { color: isDark ? "#777" : "#888" }]}>
                      {entry.translations[j]}
                    </Text>
                  ) : null}
                </View>
                {showFurigana && entry.hurigana[j] ? (
                  <Text
                    testID={`kanji-collocation-${title.toLowerCase()}-hurigana-${i}-${j}`}
                    style={[styles.backFurigana, { color: isDark ? "#888" : "#999" }]}
                  >
                    {entry.hurigana[j]}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

interface GeneralBackSectionProps {
  examples: string[];
  hurigana: string[];
  translations: string[];
  isDark: boolean;
  isActive: boolean;
  showFurigana: boolean;
}

function GeneralBackSection({
  examples,
  hurigana,
  translations,
  isDark,
  isActive,
  showFurigana,
}: GeneralBackSectionProps) {
  const { speak } = useSpeech();
  const items = examples
    .map((example, index) => ({
      example: example.trim(),
      translation: trimmedStringAt(translations, index),
      originalIndex: index,
    }))
    .filter((item) => item.example);

  const handleSpeak = React.useCallback(
    (text: string, index: number) => {
      if (!isActive) return;
      const tts = trimmedStringAt(hurigana, index) ?? stripKanaParens(text);
      void speak(tts, { language: "ja-JP" });
    },
    [isActive, speak, hurigana],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.backSection}>
      <Text style={[styles.backSectionTitle, { color: isDark ? "#999" : "#666" }]}>
        EXAMPLE
      </Text>
      <View style={styles.backPairsContainer}>
        {items.map((item) => {
          const visibleExample = showFurigana
            ? item.example
            : stripKanaParens(item.example);
          const segments = splitJapaneseTextSegments(visibleExample);

          return (
            <TouchableOpacity
              key={`general-ex-${item.originalIndex}`}
              onPress={() => handleSpeak(item.example, item.originalIndex)}
              activeOpacity={0.7}
              style={styles.backItemRow}
            >
              <Text style={[styles.backExample, { color: isDark ? "#aaa" : "#555" }]}>
                {segments.map((segment, segmentIndex) => (
                  <Text
                    key={`${item.originalIndex}-${segmentIndex}`}
                    testID={
                      segment.isKanaParen
                        ? `kanji-collocation-example-furigana-segment-${item.originalIndex}-${segmentIndex}`
                        : undefined
                    }
                    style={
                      segment.isKanaParen
                        ? [styles.backInlineFurigana, { color: isDark ? "#888" : "#999" }]
                        : undefined
                    }
                  >
                    {segment.text}
                  </Text>
                ))}
              </Text>
              {item.translation ? (
                <Text style={[styles.backTranslation, { color: isDark ? "#777" : "#888" }]}>
                  {item.translation}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function DottedDivider({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.dividerWrapper}>
      <View style={[styles.dividerInner, { borderColor: isDark ? "#444" : "#ccc" }]} />
    </View>
  );
}

interface BackSideProps {
  item: KanjiWord;
  isDark: boolean;
  isActive: boolean;
  useKorean: boolean;
  onFlip: () => void;
}

function BackSide({ item, isDark, isActive, useKorean, onFlip }: BackSideProps) {
  const meaningTranslations = useKorean ? item.meaningKoreanTranslation : item.meaningEnglishTranslation;
  const readingTranslations = useKorean ? item.readingKoreanTranslation : item.readingEnglishTranslation;
  const exampleTranslations = useKorean ? item.exampleKoreanTranslation : item.exampleEnglishTranslation;

  const [showFurigana, setShowFurigana] = React.useState(false);

  React.useEffect(() => {
    if (!isActive) setShowFurigana(false);
  }, [isActive]);

  return (
    <Pressable
      testID="kanji-collocation-back-side"
      style={[styles.back, { backgroundColor: isDark ? "#1a1a1a" : "#fff", borderColor: isDark ? "#333" : "#E0E0E0" }]}
      onPress={onFlip}
    >
      <View style={styles.backHeader}>
        <TouchableOpacity
          onPress={() => setShowFurigana((v) => !v)}
          activeOpacity={0.7}
          style={[
            styles.furiganaButton,
            showFurigana
              ? { backgroundColor: "#2EA043" }
              : {
                  borderColor: isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(17,24,28,0.16)",
                  borderWidth: 1,
                },
          ]}
        >
          <Text style={[styles.furiganaButtonText, { color: showFurigana ? "#fff" : isDark ? "#aaa" : "#666" }]}>
            がな
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.backScroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <Pressable
          testID="kanji-collocation-back-scroll-background"
          onPress={onFlip}
          style={styles.backScrollContent}
        >
          <BackSection
            title="MEANING"
            values={item.meaning}
            examples={item.meaningExample}
            hurigana={item.meaningExampleHurigana}
            translations={meaningTranslations}
            isDark={isDark}
            isActive={isActive}
            showFurigana={showFurigana}
          />
          <DottedDivider isDark={isDark} />
          <BackSection
            title="READING"
            values={item.reading}
            examples={item.readingExample}
            hurigana={item.readingExampleHurigana}
            translations={readingTranslations}
            isDark={isDark}
            isActive={isActive}
            showFurigana={showFurigana}
          />
          <DottedDivider isDark={isDark} />
          <GeneralBackSection
            examples={item.example}
            hurigana={item.exampleHurigana}
            translations={exampleTranslations}
            isDark={isDark}
            isActive={isActive}
            showFurigana={showFurigana}
          />
        </Pressable>
      </ScrollView>
    </Pressable>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function KanjiCollocationCard({
  item,
  initialIsSaved = false,
  day,
  isActive = true,
  onSavedWordChange,
}: KanjiCollocationCardProps) {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  useCardSpeechCleanup(isActive);

  const [isFlipped, setIsFlipped] = React.useState(false);
  const useKorean = i18n.language === "ko";

  React.useEffect(() => {
    if (!isActive && isFlipped) {
      setIsFlipped(false);
    }
  }, [isActive, isFlipped]);

  const handleFlipToBack = React.useCallback(() => setIsFlipped(true), []);
  const handleFlipToFront = React.useCallback(() => setIsFlipped(false), []);

  return (
    <FlipCard
      style={styles.card}
      flip={isFlipped}
      friction={10}
      perspective={2000}
      flipHorizontal={true}
      flipVertical={false}
      clickable={false}
    >
      <FaceSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        day={day}
        initialIsSaved={initialIsSaved}
        onSavedWordChange={onSavedWordChange}
        onFlip={handleFlipToBack}
      />
      <BackSide
        item={item}
        isDark={isDark}
        isActive={isActive}
        useKorean={useKorean}
        onFlip={handleFlipToFront}
      />
    </FlipCard>
  );
}

const styles = StyleSheet.create({
  card: {
    height: "100%",
    width: width * 0.9,
    alignSelf: "center",
  },
  // Face
  face: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
    padding: 24,
  },
  faceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  faceTopRowRight: {
    marginLeft: "auto",
  },
  faceContent: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  kanjiText: {
    fontSize: 64,
    fontWeight: "bold",
    textAlign: "left",
  },
  faceSection: {
    gap: 4,
  },
  faceSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  faceChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  faceListItem: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
  },
  // Back
  back: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
    overflow: "hidden",
  },
  backHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  furiganaButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  furiganaButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  backScroll: {
    flex: 1,
  },
  backScrollContent: {
    padding: 24,
    paddingBottom: 32,
    gap: 16,
  },
  backSection: {
    gap: 8,
  },
  backSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dividerWrapper: {
    height: 1,
    overflow: "hidden",
  },
  dividerInner: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  backGroup: {
    gap: 6,
    marginTop: 4,
  },
  backGroupLabel: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  backPairsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  backItemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  backPairItem: {
    flexDirection: "column",
    gap: 1,
  },
  backPairMainRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  backExampleGroup: {
    flexDirection: "column",
    gap: 1,
  },
  backExample: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  backFurigana: {
    fontSize: 8,
    lineHeight: 12,
  },
  backInlineFurigana: {
    fontSize: 12,
  },
  backTranslation: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 18,
  },
});

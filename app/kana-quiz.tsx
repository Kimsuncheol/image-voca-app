import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { QuizTimer } from "../components/course";
import { ThemedText } from "../components/themed-text";
import { getBackgroundColors } from "../constants/backgroundColors";
import { getFontColors } from "../constants/fontColors";
import { useTheme } from "../src/context/ThemeContext";
import { useSpeech } from "../src/hooks/useSpeech";
import { Char, CharCell, HIRAGANA, HIRAGANA_FLAT, KATAKANA, KATAKANA_FLAT } from "../src/data/kana";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NUM_OPTIONS = 4;
const AUTO_ADVANCE_CORRECT_MS = 800;
const AUTO_ADVANCE_WRONG_MS = 1600;
const QUESTION_TIMER_SEC = 8;
const TIMEOUT_ADVANCE_MS = 600;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Picks phonetically close distractors:
 * 1. Same consonant row (ka/ki/ku/ke/ko)
 * 2. Same vowel column (a/ka/sa/ta/na...)
 * Falls back to random from the full pool if not enough candidates.
 */
function buildDistractors(char: Char, allChars: Char[], grid: CharCell[][]): string[] {
  let charRow = -1;
  let charCol = -1;
  outer: for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]?.kana === char.kana) {
        charRow = r;
        charCol = c;
        break outer;
      }
    }
  }

  const seen = new Set<string>([char.romaji]);
  const candidates: string[] = [];

  if (charRow !== -1) {
    const sameRow = shuffle(
      grid[charRow].filter((c): c is Char => c !== null && c.kana !== char.kana),
    );
    const sameCol = shuffle(
      grid.map((row) => row[charCol]).filter((c): c is Char => c !== null && c.kana !== char.kana),
    );
    for (const c of [...sameRow, ...sameCol]) {
      if (candidates.length >= NUM_OPTIONS - 1) break;
      if (!seen.has(c.romaji)) {
        seen.add(c.romaji);
        candidates.push(c.romaji);
      }
    }
  }

  if (candidates.length < NUM_OPTIONS - 1) {
    const rest = shuffle(allChars.filter((c) => !seen.has(c.romaji)));
    for (const c of rest) {
      if (candidates.length >= NUM_OPTIONS - 1) break;
      seen.add(c.romaji);
      candidates.push(c.romaji);
    }
  }

  return candidates;
}

interface Question {
  char: Char;
  options: string[];
  correctIndex: number;
}

function buildQuestions(chars: Char[], grid: CharCell[][]): Question[] {
  return shuffle(chars).map((char) => {
    const distractors = buildDistractors(char, chars, grid);
    const options = shuffle([char.romaji, ...distractors]);
    return { char, options, correctIndex: options.indexOf(char.romaji) };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// OptionButton
// ─────────────────────────────────────────────────────────────────────────────

interface OptionButtonProps {
  label: string;
  state: "default" | "correct" | "incorrect";
  isDark: boolean;
  onPress: () => void;
  disabled: boolean;
  width: number;
}

function OptionButton({ label, state, isDark, onPress, disabled, width }: OptionButtonProps) {
  const fontColors = getFontColors(isDark);
  const bgColors = getBackgroundColors(isDark);
  const bg =
    state === "correct"
      ? bgColors.accentGreen
      : state === "incorrect"
        ? bgColors.accentRed
        : bgColors.cardSubtle;
  const color =
    state !== "default"
      ? fontColors.buttonOnAccent
      : fontColors.screenTitleStrong;

  return (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: bg, width }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <ThemedText style={[styles.optionText, { color }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResultsView
// ─────────────────────────────────────────────────────────────────────────────

interface ResultsProps {
  correct: number;
  total: number;
  wrongChars: Char[];
  isDark: boolean;
  onRetry: () => void;
  onDone: () => void;
}

function ResultsView({ correct, total, wrongChars, isDark, onRetry, onDone }: ResultsProps) {
  const { t } = useTranslation();
  const fontColors = getFontColors(isDark);
  const bgColors = getBackgroundColors(isDark);
  const pct = total > 0 ? correct / total : 0;
  const headline =
    pct >= 0.9
      ? t("kana.quiz.results.excellent")
      : pct >= 0.6
        ? t("kana.quiz.results.goodJob")
        : t("kana.quiz.results.keepPracticing");

  return (
    <ScrollView contentContainerStyle={styles.resultsContainer} showsVerticalScrollIndicator={false}>
      <ThemedText style={styles.resultsTitle}>{t("kana.quiz.results.title")}</ThemedText>
      <ThemedText style={styles.resultsScore}>
        {t("kana.quiz.results.score", { correct, total })}
      </ThemedText>
      <ThemedText style={styles.resultsHeadline}>{headline}</ThemedText>

      {wrongChars.length > 0 && (
        <View style={styles.wrongSection}>
          <ThemedText style={styles.wrongSectionTitle}>
            {t("kana.quiz.results.reviewTitle", { defaultValue: "Review These" })}
          </ThemedText>
          <View style={styles.wrongGrid}>
            {wrongChars.map((c) => (
              <View
                key={c.kana}
                style={[styles.wrongCard, { backgroundColor: bgColors.cardSubtle }]}
              >
                <ThemedText style={styles.wrongKana}>{c.kana}</ThemedText>
                <ThemedText style={styles.wrongRomaji}>{c.romaji}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.resultsButtons}>
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: bgColors.cardSubtle }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.resultBtnText}>{t("kana.quiz.results.retry")}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultBtn, { backgroundColor: bgColors.accent }]}
          onPress={onDone}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[styles.resultBtnText, { color: fontColors.buttonOnAccent }]}
          >
            {t("kana.quiz.results.done")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

type KanaType = "hiragana" | "katakana";

export default function KanaQuizScreen() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const { t } = useTranslation();
  const router = useRouter();
  const speech = useSpeech();
  const fontColors = getFontColors(isDark);
  const { type } = useLocalSearchParams<{ type: KanaType }>();
  const { width: screenWidth } = useWindowDimensions();

  const sourceChars = type === "katakana" ? KATAKANA_FLAT : HIRAGANA_FLAT;
  const sourceGrid = type === "katakana" ? KATAKANA : HIRAGANA;

  const [questions, setQuestions] = useState<Question[]>(() =>
    buildQuestions(sourceChars, sourceGrid),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongChars, setWrongChars] = useState<Char[]>([]);
  const [finished, setFinished] = useState(false);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(true);
  const isNavigatingRef = useRef(false);

  const current = questions[currentIndex];
  const isAnswered = selectedIndex !== null;
  const isCorrectAnswer = selectedIndex === current.correctIndex;

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const stopCountdown = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  const advanceQuestion = useCallback(() => {
    stopCountdown();
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  }, [currentIndex, questions.length, stopCountdown]);

  // Called by QuizTimer when the animated bar reaches zero
  const handleTimeUp = useCallback(() => {
    setWrongChars((prev) => [...prev, current.char]);
    setSelectedIndex(-1);
    autoAdvanceTimer.current = setTimeout(() => {
      if (!isFocusedRef.current) return;
      advanceQuestion();
    }, TIMEOUT_ADVANCE_MS);
  }, [current, advanceQuestion]);

  const handleOption = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      setSelectedIndex(index);

      const correct = index === current.correctIndex;
      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongChars((prev) => [...prev, current.char]);
      }

      speech.speak(current.char.kana, { language: "ja-JP" });

      const delay = correct ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_WRONG_MS;
      autoAdvanceTimer.current = setTimeout(() => {
        if (!isFocusedRef.current) return;
        advanceQuestion();
      }, delay);
    },
    [selectedIndex, current, speech, advanceQuestion],
  );

  // Tap the kana card after answering to skip the remaining delay
  const handleSkip = useCallback(() => {
    if (!isAnswered) return;
    advanceQuestion();
  }, [isAnswered, advanceQuestion]);

  const handleRetry = useCallback(() => {
    stopCountdown();
    setQuestions(buildQuestions(sourceChars, sourceGrid));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setCorrectCount(0);
    setWrongChars([]);
    setFinished(false);
  }, [sourceChars, sourceGrid, stopCountdown]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Quit confirmation on hardware back (Android)
  useEffect(() => {
    if (finished) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        t("quiz.quit.title"),
        t("quiz.quit.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("quiz.quit.confirm"), style: "destructive", onPress: () => router.back() },
        ],
      );
      return true;
    });
    return () => sub.remove();
  }, [finished, t, router]);

  // Cancel auto-advance timer on unmount
  useEffect(() => {
    return () => stopCountdown();
  }, [stopCountdown]);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  const handleDone = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.back();
  }, [router]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const typeLabel = t(
    type === "katakana" ? "kana.katakana" : "kana.hiragana",
    { defaultValue: type === "katakana" ? "Katakana" : "Hiragana" },
  );

  const optionButtonWidth = (screenWidth - 40 - 10) / 2;

  const optionStates = useMemo(() => {
    if (selectedIndex === null) return current.options.map(() => "default" as const);
    return current.options.map((_, i) => {
      if (i === current.correctIndex) return "correct" as const;
      if (i === selectedIndex) return "incorrect" as const;
      return "default" as const;
    });
  }, [selectedIndex, current]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColors.screen }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: `${typeLabel} ${t("kana.quiz.title", { defaultValue: "Quiz" })}`,
          headerBackTitle: t("common.back"),
        }}
      />

      {finished ? (
        <ResultsView
          correct={correctCount}
          total={questions.length}
          wrongChars={wrongChars}
          isDark={isDark}
          onRetry={handleRetry}
          onDone={handleDone}
        />
      ) : (
        <View style={styles.quizContainer}>
          {/* Progress counter */}
          <ThemedText style={styles.progress}>
            {t("kana.quiz.question", { current: currentIndex + 1, total: questions.length })}
          </ThemedText>

          {/* Animated countdown bar — resets each question via quizKey */}
          <QuizTimer
            duration={QUESTION_TIMER_SEC}
            isRunning={selectedIndex === null && !finished}
            quizKey={currentIndex.toString()}
            onTimeUp={handleTimeUp}
          />

          {/* Kana card — tap to skip post-answer delay */}
          <TouchableOpacity
            style={[styles.kanaCard, { backgroundColor: bgColors.cardSubtle }]}
            onPress={handleSkip}
            activeOpacity={isAnswered ? 0.7 : 1}
            disabled={!isAnswered}
          >
            <ThemedText style={styles.kanaChar}>{current.char.kana}</ThemedText>
            <ThemedText style={styles.prompt}>
              {t("kana.quiz.prompt", { defaultValue: "What is the romaji for this character?" })}
            </ThemedText>
          </TouchableOpacity>

          {/* Fixed-height feedback slot — prevents layout shift */}
          <View style={styles.feedbackSlot}>
            {isAnswered && (
              <ThemedText
                style={[
                  styles.feedback,
                  {
                    color: isCorrectAnswer
                      ? fontColors.quizCorrect
                      : fontColors.dangerAction,
                  },
                ]}
              >
                {isCorrectAnswer
                  ? t("kana.quiz.correct")
                  : selectedIndex === -1
                    ? t("kana.quiz.timeUp", { answer: current.char.romaji, defaultValue: "Time's up! · {{answer}}" })
                    : t("kana.quiz.correctAnswer", { answer: current.char.romaji })}
              </ThemedText>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {current.options.map((option, i) => (
              <OptionButton
                key={i}
                label={option}
                state={optionStates[i]}
                isDark={isDark}
                onPress={() => handleOption(i)}
                disabled={isAnswered}
                width={optionButtonWidth}
              />
            ))}
          </View>

        </View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quizContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progress: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  kanaCard: {
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: "center",
    marginTop: 28,
  },
  kanaChar: {
    fontSize: 80,
    fontWeight: "500",
    lineHeight: 96,
  },
  prompt: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 8,
  },
  feedbackSlot: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  feedback: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  optionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "500",
  },
  // Results
  resultsContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 40,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultsScore: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultsHeadline: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 32,
  },
  wrongSection: {
    width: "100%",
    marginBottom: 32,
  },
  wrongSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
    textAlign: "center",
  },
  wrongGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  wrongCard: {
    width: 60,
    height: 68,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  wrongKana: {
    fontSize: 26,
    fontWeight: "500",
  },
  wrongRomaji: {
    fontSize: 11,
    opacity: 0.5,
    fontWeight: "500",
  },
  resultsButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  resultBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resultBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

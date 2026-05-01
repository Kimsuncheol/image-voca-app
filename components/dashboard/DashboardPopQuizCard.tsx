import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { BackgroundColors, getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";
import { useAuth } from "../../src/context/AuthContext";
import { useLearningLanguage } from "../../src/context/LearningLanguageContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  fetchPopQuizMatchingGamesBatch,
  type FetchPopQuizBatchResult,
  type PopQuizMatchingGame,
  type PopQuizUnavailableReason,
} from "../../src/services/popQuizService";
import { useUserStatsStore } from "../../src/stores";
import type { CourseProgress } from "../../src/stores";
import {
  CourseType,
  findRuntimeCourse,
  isCourseAvailableForLanguage,
  isJlptLevelCourseId,
} from "../../src/types/vocabulary";
import {
  formatIdiomMeaningForDisplay,
  formatIdiomTitleForDisplay,
  getIdiomTitleFontSize,
  getIdiomTitleMinimumFontScale,
  isNumberedMeaningDisplayCourseId,
} from "../../src/utils/idiomDisplay";
import { ThemedText } from "../themed-text";

const WRONG_FEEDBACK_MS = 700;
const PAGE_ADVANCE_MS = 250;
const PAIRS_PER_PAGE = 5;

type QuizState = {
  selectedItemId: string | null;
  selectedChoiceId: string | null;
  matchedChoiceByItemId: Record<string, string>;
  wrongItemId: string | null;
  wrongChoiceId: string | null;
  completed: boolean;
};

const INITIAL_STATE: QuizState = {
  selectedItemId: null,
  selectedChoiceId: null,
  matchedChoiceByItemId: {},
  wrongItemId: null,
  wrongChoiceId: null,
  completed: false,
};

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getTileTextMetrics = (
  text: string,
  variant: "item" | "choice",
  courseId?: string,
) => {
  if (variant === "item" && isNumberedMeaningDisplayCourseId(courseId)) {
    const longestLine = text
      .split("\n")
      .reduce((longest, line) => (line.length > longest.length ? line : longest), "");
    const fontSize = getIdiomTitleFontSize(
      longestLine || text,
      courseId,
      FontSizes.titleLg,
    );

    return {
      fontSize,
      lineHeight: Math.round(fontSize * 1.25),
      fontWeight: FontWeights.bold,
      minimumFontScale: getIdiomTitleMinimumFontScale(
        courseId,
        FontSizes.titleLg,
        fontSize,
      ),
    };
  }

  const compactLength = text.replace(/\s+/g, "").length;
  const hasMultipleLines = text.includes("\n");

  if (variant === "choice") {
    if (hasMultipleLines || compactLength > 34) {
      return {
        fontSize: FontSizes.caption,
        lineHeight: LineHeights.body,
        fontWeight: FontWeights.semiBold,
        minimumFontScale: 0.7,
      };
    }
    if (compactLength > 22) {
      return {
        fontSize: FontSizes.label,
        lineHeight: LineHeights.bodyMd,
        fontWeight: FontWeights.semiBold,
        minimumFontScale: 0.72,
      };
    }
  }

  if (compactLength > 26) {
    return {
      fontSize: FontSizes.body,
      lineHeight: LineHeights.bodyLg,
      fontWeight: FontWeights.semiBold,
      minimumFontScale: 0.64,
    };
  }

  if (compactLength > 16) {
    return {
      fontSize: FontSizes.bodyMd,
      lineHeight: LineHeights.bodyXl,
      fontWeight: FontWeights.bold,
      minimumFontScale: 0.68,
    };
  }

  return {
    fontSize: FontSizes.bodyLg,
    lineHeight: LineHeights.title,
    fontWeight: FontWeights.bold,
    minimumFontScale: 0.78,
  };
};

const getFirstIncompleteDay = (
  progress: CourseProgress | undefined,
) => {
  const entries = Object.keys(progress ?? {})
    .map((key) => Number(key))
    .filter((day) => Number.isInteger(day) && day > 0)
    .sort((a, b) => a - b);

  if (entries.length === 0) return 1;

  for (const day of entries) {
    if (!progress?.[day]?.completed) return day;
  }

  return entries[entries.length - 1] + 1;
};

const getUnavailableKey = (reason?: PopQuizUnavailableReason) => {
  switch (reason) {
    case "missing-course":
      return "dashboard.popQuiz.unavailable.missingCourse";
    case "missing-level":
      return "dashboard.popQuiz.unavailable.missingLevel";
    case "missing-config":
    case "invalid-config":
      return "dashboard.popQuiz.unavailable.missingConfig";
    case "not-found":
    case "missing-branch":
    case "missing-day":
      return "dashboard.popQuiz.unavailable.missingData";
    case "malformed":
      return "dashboard.popQuiz.unavailable.malformed";
    default:
      return "dashboard.popQuiz.unavailable.generic";
  }
};

export function DashboardPopQuizCard() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { learningLanguage, recentCourseByLanguage } = useLearningLanguage();
  const { courseProgress, fetchCourseProgress } = useUserStatsStore();

  const [game, setGame] = useState<PopQuizMatchingGame | null>(null);
  const [unavailableReason, setUnavailableReason] =
    useState<PopQuizUnavailableReason>();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<QuizState>(INITIAL_STATE);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [prefetchedDayResults, setPrefetchedDayResults] =
    useState<FetchPopQuizBatchResult>({});
  const [shuffledChoices, setShuffledChoices] =
    useState<PopQuizMatchingGame["choices"]>([]);
  const wrongTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageAdvanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCourse = useMemo(() => {
    const recentCourse = recentCourseByLanguage[learningLanguage];
    if (!recentCourse) return undefined;
    if (!isCourseAvailableForLanguage(recentCourse, learningLanguage)) {
      return undefined;
    }
    if (learningLanguage === "ja" && !isJlptLevelCourseId(recentCourse)) {
      return undefined;
    }
    return recentCourse as CourseType;
  }, [learningLanguage, recentCourseByLanguage]);

  const dayNumber = getFirstIncompleteDay(
    selectedCourse ? courseProgress[selectedCourse] : undefined,
  );
  const courseColor = findRuntimeCourse(selectedCourse)?.color ?? BackgroundColors.light.accentBlue;

  const answerByItemId = useMemo(() => {
    const entries = game?.answer_key.map((answer): [string, string] => [
      answer.item_id,
      answer.choice_id,
    ]);
    return new Map(entries ?? []);
  }, [game]);

  const matchedChoiceIds = useMemo(
    () => new Set(Object.values(state.matchedChoiceByItemId)),
    [state.matchedChoiceByItemId],
  );
  const totalPages = Math.max(1, Math.ceil((game?.items.length ?? 0) / PAIRS_PER_PAGE));
  const visibleItems = useMemo(() => {
    if (!game) return [];
    const pageStart = currentPageIndex * PAIRS_PER_PAGE;
    return game.items.slice(pageStart, pageStart + PAIRS_PER_PAGE);
  }, [currentPageIndex, game]);
  const visibleChoiceIds = useMemo(
    () =>
      new Set(
        visibleItems
          .map((item) => answerByItemId.get(item.id))
          .filter((choiceId): choiceId is string => Boolean(choiceId)),
      ),
    [answerByItemId, visibleItems],
  );
  const visibleChoices = useMemo(
    () => shuffledChoices.filter((choice) => visibleChoiceIds.has(choice.id)),
    [shuffledChoices, visibleChoiceIds],
  );
  const isLastPage = currentPageIndex >= totalPages - 1;
  const currentPageMatched =
    Boolean(game) &&
    visibleItems.length > 0 &&
    visibleItems.every((item) => Boolean(state.matchedChoiceByItemId[item.id]));

  const clearTransientState = useCallback(() => {
    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    setState((current) => ({
      ...current,
      selectedItemId: null,
      selectedChoiceId: null,
      wrongItemId: null,
      wrongChoiceId: null,
    }));
  }, []);

  const resetGame = useCallback((nextGame: PopQuizMatchingGame | null) => {
    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    if (pageAdvanceTimerRef.current) {
      clearTimeout(pageAdvanceTimerRef.current);
      pageAdvanceTimerRef.current = null;
    }
    setCurrentPageIndex(0);
    setState(INITIAL_STATE);
    setShuffledChoices(nextGame ? shuffleArray(nextGame.choices) : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user || !selectedCourse) return;
      void fetchCourseProgress(user.uid, selectedCourse);
    }, [fetchCourseProgress, selectedCourse, user]),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        setLoading(true);
        setUnavailableReason(undefined);
        setGame(null);
        resetGame(null);

        const results = await fetchPopQuizMatchingGamesBatch({
          language: learningLanguage,
          course: selectedCourse,
          days: [dayNumber, dayNumber + 1],
          appLanguage: i18n.language,
        });

        if (!active) return;
        const result = results[dayNumber] ?? {
          game: null,
          reason: "missing-day" as const,
        };
        setActiveDayNumber(dayNumber);
        setPrefetchedDayResults(results);
        setGame(result.game);
        setUnavailableReason(result.reason);
        resetGame(result.game);
        setLoading(false);
      };

      void load();

      return () => {
        active = false;
      };
    }, [dayNumber, i18n.language, learningLanguage, resetGame, selectedCourse]),
  );

  React.useEffect(
    () => () => {
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      if (pageAdvanceTimerRef.current) clearTimeout(pageAdvanceTimerRef.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!currentPageMatched || isLastPage || state.completed) return undefined;

    pageAdvanceTimerRef.current = setTimeout(() => {
      clearTransientState();
      setCurrentPageIndex((pageIndex) =>
        Math.min(pageIndex + 1, totalPages - 1),
      );
      pageAdvanceTimerRef.current = null;
    }, PAGE_ADVANCE_MS);

    return () => {
      if (pageAdvanceTimerRef.current) {
        clearTimeout(pageAdvanceTimerRef.current);
        pageAdvanceTimerRef.current = null;
      }
    };
  }, [clearTransientState, currentPageMatched, isLastPage, state.completed, totalPages]);

  React.useEffect(() => {
    if (!state.completed || !game) return undefined;

    const nextDay = activeDayNumber + 1;
    const nextResult = prefetchedDayResults[nextDay] ?? {
      game: null,
      reason: "missing-day" as const,
    };

    pageAdvanceTimerRef.current = setTimeout(() => {
      setActiveDayNumber(nextDay);
      setGame(nextResult.game);
      setUnavailableReason(nextResult.reason);
      resetGame(nextResult.game);
      setLoading(false);
      pageAdvanceTimerRef.current = null;

      if (nextResult.game) {
        void fetchPopQuizMatchingGamesBatch({
          language: learningLanguage,
          course: selectedCourse,
          days: [nextDay + 1],
          appLanguage: i18n.language,
        })
          .then((results) => {
            setPrefetchedDayResults((current) => ({
              ...current,
              ...results,
            }));
          })
          .catch(() => {
            // Prefetch failures should not interrupt the active quiz.
          });
      }
    }, PAGE_ADVANCE_MS);

    return () => {
      if (pageAdvanceTimerRef.current) {
        clearTimeout(pageAdvanceTimerRef.current);
        pageAdvanceTimerRef.current = null;
      }
    };
  }, [
    activeDayNumber,
    game,
    i18n.language,
    learningLanguage,
    prefetchedDayResults,
    resetGame,
    selectedCourse,
    state.completed,
  ]);

  const completeMatch = useCallback(
    (itemId: string, choiceId: string) => {
      if (!game) return;
      const expectedChoiceId = answerByItemId.get(itemId);
      const correct = expectedChoiceId === choiceId;
      const totalItems = game.items.length;

      if (!correct) {
        if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
        setState((current) => ({
          ...current,
          selectedItemId: null,
          selectedChoiceId: null,
          wrongItemId: itemId,
          wrongChoiceId: choiceId,
        }));
        wrongTimerRef.current = setTimeout(() => {
          setState((current) => ({
            ...current,
            wrongItemId: null,
            wrongChoiceId: null,
          }));
          wrongTimerRef.current = null;
        }, WRONG_FEEDBACK_MS);
        return;
      }

      setState((current) => {
        const matchedChoiceByItemId = {
          ...current.matchedChoiceByItemId,
          [itemId]: choiceId,
        };
        return {
          ...current,
          selectedItemId: null,
          selectedChoiceId: null,
          matchedChoiceByItemId,
          completed:
            Object.keys(matchedChoiceByItemId).length === totalItems,
        };
      });
    },
    [answerByItemId, game],
  );

  const handleItemPress = useCallback(
    (itemId: string) => {
      if (state.wrongItemId || state.wrongChoiceId) return;
      if (state.matchedChoiceByItemId[itemId]) return;
      if (state.selectedChoiceId) {
        completeMatch(itemId, state.selectedChoiceId);
        return;
      }
      setState((current) => ({ ...current, selectedItemId: itemId }));
    },
    [completeMatch, state],
  );

  const handleChoicePress = useCallback(
    (choiceId: string) => {
      if (state.wrongItemId || state.wrongChoiceId) return;
      if (matchedChoiceIds.has(choiceId)) return;
      if (state.selectedItemId) {
        completeMatch(state.selectedItemId, choiceId);
        return;
      }
      setState((current) => ({ ...current, selectedChoiceId: choiceId }));
    },
    [completeMatch, matchedChoiceIds, state],
  );

  return (
    <View style={[styles.card, { backgroundColor: bgColors.cardSubtle }]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <ThemedText style={styles.title}>{t("dashboard.popQuiz.title")}</ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.stateBlock}>
          <ActivityIndicator color={courseColor} />
          <ThemedText style={styles.stateText}>
            {t("dashboard.popQuiz.loading")}
          </ThemedText>
        </View>
      ) : !game ? (
        <View style={styles.stateBlock}>
          <Ionicons name="game-controller-outline" size={28} color={fontColors.iconMuted} />
          <ThemedText style={styles.stateTitle}>
            {t("dashboard.popQuiz.unavailable.title")}
          </ThemedText>
          <ThemedText style={styles.stateText}>
            {t(getUnavailableKey(unavailableReason), {
              day: activeDayNumber,
            })}
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.gameGrid}>
            <View style={styles.column}>
              {visibleItems.map((item) => {
                const isMatched = Boolean(state.matchedChoiceByItemId[item.id]);
                const displayText = formatIdiomTitleForDisplay(
                  item.word,
                  game.course,
                  FontSizes.titleLg,
                );
                return (
                  <PopQuizTile
                    key={item.id}
                    text={displayText}
                    variant="item"
                    courseId={game.course}
                    isDark={isDark}
                    color={courseColor}
                    state={
                      isMatched
                        ? "correct"
                        : state.wrongItemId === item.id
                          ? "wrong"
                          : state.selectedItemId === item.id
                            ? "selected"
                            : "neutral"
                    }
                    onPress={() => handleItemPress(item.id)}
                    disabled={isMatched}
                    testID={`pop-quiz-item-${item.id}`}
                  />
                );
              })}
            </View>

            <View style={styles.column}>
              {visibleChoices.map((choice) => {
                const isMatched = matchedChoiceIds.has(choice.id);
                const displayText = formatIdiomMeaningForDisplay(
                  choice.text,
                  game.course,
                );
                return (
                  <PopQuizTile
                    key={choice.id}
                    text={displayText}
                    variant="choice"
                    courseId={game.course}
                    isDark={isDark}
                    color={courseColor}
                    state={
                      isMatched
                        ? "correct"
                        : state.wrongChoiceId === choice.id
                          ? "wrong"
                          : state.selectedChoiceId === choice.id
                            ? "selected"
                            : "neutral"
                    }
                    onPress={() => handleChoicePress(choice.id)}
                    disabled={isMatched}
                    testID={`pop-quiz-choice-${choice.id}`}
                  />
                );
              })}
            </View>
          </View>

        </>
      )}
    </View>
  );
}

function PopQuizTile({
  text,
  variant,
  courseId,
  state,
  color,
  isDark,
  disabled,
  onPress,
  testID,
}: {
  text: string;
  variant: "item" | "choice";
  courseId?: string;
  state: "neutral" | "selected" | "correct" | "wrong";
  color: string;
  isDark: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const backgroundColor = isDark ? "#111" : "#fff";
  const borderColor =
    state === "correct"
      ? BackgroundColors.light.accentGreen
      : state === "wrong"
        ? BackgroundColors.light.accentRed
        : state === "selected"
          ? color
          : "transparent";
  const tileBackground =
    state === "correct"
      ? BackgroundColors.light.successSoft
      : state === "wrong"
        ? BackgroundColors.light.accentRedSoft
        : state === "selected"
          ? `${color}18`
          : backgroundColor;
  const textMetrics = getTileTextMetrics(text, variant, courseId);
  const isIdiomTitle =
    variant === "item" && isNumberedMeaningDisplayCourseId(courseId);
  const hasDisplayLineBreak = text.includes("\n");
  const shouldFitSingleLineIdiomTitle = isIdiomTitle && !hasDisplayLineBreak;
  const numberOfLines =
    isIdiomTitle || (variant === "choice" && hasDisplayLineBreak)
      ? hasDisplayLineBreak
        ? undefined
        : 1
      : 2;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: tileBackground,
          borderColor,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <ThemedText
        testID={testID ? `${testID}-text` : undefined}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={
          shouldFitSingleLineIdiomTitle ? true : !hasDisplayLineBreak
        }
        minimumFontScale={textMetrics.minimumFontScale}
        style={[
          styles.tileText,
          {
            fontSize: textMetrics.fontSize,
            lineHeight: textMetrics.lineHeight,
            fontWeight: textMetrics.fontWeight,
          },
          state === "selected" && { color },
          state === "correct" && styles.correctText,
          state === "wrong" && styles.wrongText,
        ]}
      >
        {text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSizes.titleLg,
    lineHeight: LineHeights.titleXl,
    fontWeight: FontWeights.bold,
  },
  stateBlock: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  stateTitle: {
    fontSize: FontSizes.bodyLg,
    fontWeight: FontWeights.semiBold,
    textAlign: "center",
  },
  stateText: {
    fontSize: FontSizes.body,
    lineHeight: LineHeights.bodyLg,
    opacity: 0.68,
    textAlign: "center",
  },
  gameGrid: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  tile: {
    minHeight: 62,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tileText: {
    fontSize: FontSizes.bodyLg,
    lineHeight: LineHeights.title,
    fontWeight: FontWeights.bold,
    textAlign: "center",
  },
  correctText: {
    color: BackgroundColors.light.accentGreen,
  },
  wrongText: {
    color: BackgroundColors.light.accentRed,
  },
});

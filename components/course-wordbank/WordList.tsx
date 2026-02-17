import React from "react";
import PagerView from "react-native-pager-view";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseType } from "../../src/types/vocabulary";
import { CollocationFlipCard } from "../CollocationFlipCard";
import { SavedWord, WordCard } from "../wordbank/WordCard";

interface WordListProps {
  words: SavedWord[];
  courseId: string;
  courseColor?: string;
  isDark: boolean;
  onDelete: (wordId: string) => void;
}

const FEEDBACK_THROTTLE_MS = 900;

/**
 * Word List Component
 *
 * Displays a list of saved words using the appropriate card type
 * - Uses CollocationFlipCard for COLLOCATION course
 * - Uses WordCard for other courses (CSAT, IELTS, TOEFL, TOEIC)
 */
export function WordList({
  words,
  courseId,
  courseColor,
  isDark,
  onDelete,
}: WordListProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pagerRef = React.useRef<PagerView>(null);
  const currentIndexRef = React.useRef(0);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const revertingTargetRef = React.useRef<number | null>(null);
  const isBlockingForwardDragRef = React.useRef(false);
  const lastFeedbackAtRef = React.useRef(0);
  const hintOpacity = React.useRef(new Animated.Value(0)).current;
  const hintTranslateY = React.useRef(new Animated.Value(6)).current;
  const [isHintVisible, setIsHintVisible] = React.useState(false);

  React.useEffect(() => {
    currentIndexRef.current = 0;
    unlockedIndicesRef.current = new Set();
    revertingTargetRef.current = null;
    isBlockingForwardDragRef.current = false;
    lastFeedbackAtRef.current = 0;
    setIsHintVisible(false);
    hintOpacity.setValue(0);
    hintTranslateY.setValue(6);
  }, [courseId, words.length]);

  const unlockIndex = React.useCallback((index: number) => {
    unlockedIndicesRef.current.add(index);
  }, []);

  const triggerBlockedFeedback = React.useCallback(() => {
    const now = Date.now();
    if (now - lastFeedbackAtRef.current < FEEDBACK_THROTTLE_MS) {
      return;
    }
    lastFeedbackAtRef.current = now;

    if (Platform.OS === "ios") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );
    }

    setIsHintVisible(true);
    hintOpacity.stopAnimation();
    hintTranslateY.stopAnimation();
    hintOpacity.setValue(0);
    hintTranslateY.setValue(6);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(hintOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(hintTranslateY, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(620),
      Animated.parallel([
        Animated.timing(hintOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(hintTranslateY, {
          toValue: 4,
          duration: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) {
        setIsHintVisible(false);
      }
    });
  }, [hintOpacity, hintTranslateY]);

  const blockForwardFromIndex = React.useCallback(
    (index: number) => {
      if (unlockedIndicesRef.current.has(index)) {
        return false;
      }

      revertingTargetRef.current = index;
      pagerRef.current?.setPageWithoutAnimation(index);
      triggerBlockedFeedback();
      return true;
    },
    [triggerBlockedFeedback],
  );

  const handlePageScroll = React.useCallback(
    (e: any) => {
      const { position, offset } = e.nativeEvent;
      const currentIndex = currentIndexRef.current;
      const isForwardDragAttempt = position === currentIndex && offset > 0;

      if (!isForwardDragAttempt || isBlockingForwardDragRef.current) {
        return;
      }

      if (blockForwardFromIndex(currentIndex)) {
        isBlockingForwardDragRef.current = true;
      }
    },
    [blockForwardFromIndex],
  );

  const handlePageScrollStateChanged = React.useCallback((e: any) => {
    const state = e.nativeEvent.pageScrollState;
    if (state === "idle") {
      isBlockingForwardDragRef.current = false;
      if (revertingTargetRef.current === currentIndexRef.current) {
        revertingTargetRef.current = null;
      }
    }
  }, []);

  const handlePageSelected = React.useCallback(
    (e: any) => {
      const nextIndex = e.nativeEvent.position;

      if (
        revertingTargetRef.current !== null &&
        nextIndex === revertingTargetRef.current
      ) {
        revertingTargetRef.current = null;
        return;
      }

      const previousIndex = currentIndexRef.current;
      if (nextIndex > previousIndex && blockForwardFromIndex(previousIndex)) {
        return;
      }

      currentIndexRef.current = nextIndex;
      isBlockingForwardDragRef.current = false;
    },
    [blockForwardFromIndex],
  );

  // COLLOCATION course uses special flip card design
  if (courseId === "COLLOCATION") {
    return (
      <View style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          onPageScroll={handlePageScroll}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={handlePageSelected}
          orientation="horizontal"
        >
          {words.map((word, index) => (
            <View key={word.id} style={styles.page}>
              <CollocationFlipCard
                data={{
                  collocation: word.word,
                  meaning: word.meaning,
                  explanation: word.pronunciation || "", // Explanation stored in pronunciation field
                  example: word.example,
                  translation: word.translation || "",
                }}
                isDark={isDark}
                wordBankConfig={{
                  id: word.id,
                  course: courseId as CourseType,
                  day: word.day,
                  initialIsSaved: true, // Already saved in word bank
                  enableAdd: false, // Can't add again
                  enableDelete: true, // Can delete from word bank
                  onDelete,
                }}
                onFirstFlipToBack={() => unlockIndex(index)}
              />
            </View>
          ))}
        </PagerView>
        {isHintVisible && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.hintContainer,
              isDark ? styles.hintContainerDark : styles.hintContainerLight,
              { top: insets.top + 12 },
              { opacity: hintOpacity, transform: [{ translateY: hintTranslateY }] },
            ]}
          >
            <Text style={isDark ? styles.hintTextDark : styles.hintTextLight}>
              {t("swipe.hints.flipFirst")}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }

  // Regular courses use standard word card
  return (
    <>
      {words.map((word, index) => (
        <WordCard
          key={word.id + index}
          word={word}
          courseColor={courseColor}
          isDark={isDark}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  pagerView: {
    flex: 1,
    width: "100%",
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hintContainer: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hintContainerLight: {
    backgroundColor: "rgba(0, 0, 0, 0.78)",
  },
  hintContainerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  hintTextLight: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  hintTextDark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

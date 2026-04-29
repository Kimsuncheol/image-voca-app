import * as Haptics from "expo-haptics";
import React from "react";
import { useTranslation } from "react-i18next";
import { Animated, Platform, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VocabularyCard } from "../../src/types/vocabulary";
import { CollocationFlipCard } from "./index";
import { styles } from "./EnglishCollocationCardStyle";

interface Props {
  data: VocabularyCard[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onFinish?: () => void;
  renderFinalPage?: () => React.ReactNode;
  isDark?: boolean;
  day?: number;
  savedWordIds?: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  isStudyCompleted?: boolean;
  isPreviewMode?: boolean;
}

const FEEDBACK_THROTTLE_MS = 900;

export const CollocationSwipeable: React.FC<Props> = ({
  data,
  initialIndex = 0,
  onIndexChange,
  onFinish,
  renderFinalPage,
  isDark = false,
  day,
  savedWordIds,
  onSavedWordChange,
  isStudyCompleted = false,
  isPreviewMode = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const normalizedInitialIndex =
    initialIndex <= data.length ? initialIndex : Math.max(0, data.length - 1);
  const pagerRef = React.useRef<PagerView>(null);
  const currentIndexRef = React.useRef(normalizedInitialIndex);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const revertingTargetRef = React.useRef<number | null>(null);
  const isBlockingForwardDragRef = React.useRef(false);
  const lastFeedbackAtRef = React.useRef(0);
  const hintOpacity = React.useRef(new Animated.Value(0)).current;
  const hintTranslateY = React.useRef(new Animated.Value(6)).current;
  const [isHintVisible, setIsHintVisible] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(normalizedInitialIndex);

  React.useEffect(() => {
    currentIndexRef.current = normalizedInitialIndex;
    setActiveIndex(normalizedInitialIndex);
    unlockedIndicesRef.current = new Set();
    revertingTargetRef.current = null;
    isBlockingForwardDragRef.current = false;
    lastFeedbackAtRef.current = 0;
    setIsHintVisible(false);
    hintOpacity.setValue(0);
    hintTranslateY.setValue(6);
  }, [data.length, hintOpacity, hintTranslateY, normalizedInitialIndex]);

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
      if (isStudyCompleted || unlockedIndicesRef.current.has(index)) {
        return false;
      }
      revertingTargetRef.current = index;
      pagerRef.current?.setPageWithoutAnimation(index);
      triggerBlockedFeedback();
      return true;
    },
    [triggerBlockedFeedback, isStudyCompleted],
  );

  const handlePageScroll = React.useCallback(
    (e: any) => {
      const { position, offset } = e.nativeEvent;
      const currentIndex = currentIndexRef.current;
      const isForwardDragAttempt = position === currentIndex && offset > 0;

      if (!isForwardDragAttempt || isBlockingForwardDragRef.current || currentIndex >= data.length) {
        return;
      }

      if (blockForwardFromIndex(currentIndex)) {
        isBlockingForwardDragRef.current = true;
      }
    },
    [blockForwardFromIndex, data.length],
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

      // Ignore the synthetic selection event caused by snap-back.
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
      setActiveIndex(nextIndex);
      isBlockingForwardDragRef.current = false;
      onIndexChange?.(nextIndex);

      // If we have a final page and we reached it, trigger onFinish.
      if (renderFinalPage && nextIndex === data.length) {
        onFinish?.();
      }
    },
    [
      blockForwardFromIndex,
      data.length,
      onFinish,
      onIndexChange,
      renderFinalPage,
    ],
  );

  const handleCardFirstFlip = React.useCallback(
    (index: number) => {
      // Keep unlock persistent while this pager session is mounted.
      unlockIndex(index);
    },
    [unlockIndex],
  );

  return (
    <View style={styles.swipeableContainer}>
      <PagerView
        ref={pagerRef}
        style={styles.swipeablePagerView}
        initialPage={normalizedInitialIndex}
        onPageScroll={handlePageScroll}
        onPageScrollStateChanged={handlePageScrollStateChanged}
        onPageSelected={handlePageSelected}
        orientation="horizontal"
        scrollEnabled={activeIndex < data.length}
      >
        {data.map((item, index) => (
          <View key={item.id} style={styles.swipeablePage}>
            <View style={styles.swipeableCardCenteringWrapper}>
              {Math.abs(index - activeIndex) <= 1 ? (
                <CollocationFlipCard
                  data={{
                    collocation: item.word,
                    meaning: item.meaning,
                    explanation: item.pronunciation || "",
                    example: item.example,
                    translation: item.translation || "",
                    imageUrl: item.imageUrl,
                  }}
                  isDark={isDark}
                  wordBankConfig={{
                    id: item.id,
                    course: item.course,
                    day,
                    initialIsSaved: isPreviewMode
                      ? false
                      : (savedWordIds?.has(item.id) ?? false),
                    enableAdd: !isPreviewMode,
                    enableDelete: false,
                    onSavedStateChange: isPreviewMode
                      ? undefined
                      : onSavedWordChange,
                  }}
                  onFirstFlipToBack={() => handleCardFirstFlip(index)}
                  isActive={activeIndex === index}
                />
              ) : (
                <View style={styles.swipeableCardPlaceholder} />
              )}
            </View>
          </View>
        ))}
        {renderFinalPage && (
          <View key="final-page" style={styles.swipeablePage}>
            {renderFinalPage()}
          </View>
        )}
      </PagerView>
      {isHintVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.swipeableHintContainer,
            isDark ? styles.swipeableHintContainerDark : styles.swipeableHintContainerLight,
            { top: insets.top + 12 },
            {
              opacity: hintOpacity,
              transform: [{ translateY: hintTranslateY }],
            },
          ]}
        >
          <Text style={isDark ? styles.swipeableHintTextDark : styles.swipeableHintTextLight}>
            {t("swipe.hints.flipFirst")}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};



export default CollocationSwipeable;

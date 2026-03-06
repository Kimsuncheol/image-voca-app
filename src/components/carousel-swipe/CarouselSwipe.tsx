import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("screen");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const TRANSITION_DURATION = 280;

export interface CarouselSwipeRef {
  goNext: () => void;
  goPrev: () => void;
}

interface CarouselSwipeProps {
  data: any[];
  renderCard: (item: any) => React.ReactNode;
  /** Called when user swipes right (→ next word) */
  onSwipeRight?: (item: any) => void;
  /** Called when user swipes left (→ previous word) */
  onSwipeLeft?: (item: any) => void;
  onRunOutOfCards?: () => void;
  onIndexChange?: (index: number) => void;
}

/**
 * CarouselSwipe
 *
 * A horizontal carousel for vocabulary cards.
 * - Right swipe → next word
 * - Left  swipe → previous word
 *
 * Layout: [prev | current | next]  (right → left in the view's coordinate space)
 *   prevCard  offset = +SCREEN_WIDTH
 *   currentCard offset = 0
 *   nextCard  offset = -SCREEN_WIDTH
 *
 * When the user drags right (+dx), everything shifts by +dx,
 * so the next card (at -SCREEN_WIDTH + dx) moves toward centre.
 * When dx reaches SCREEN_WIDTH, next card is at 0 → commit transition.
 */
export const CarouselSwipe = forwardRef<CarouselSwipeRef, CarouselSwipeProps>(
  (
    {
      data,
      renderCard,
      onSwipeRight,
      onSwipeLeft,
      onRunOutOfCards,
      onIndexChange,
    },
    ref,
  ) => {
    const [index, setIndex] = useState(0);
    const offset = useSharedValue(0);
    const isTransitioning = useSharedValue(false);

    // Stable refs so gesture worklet always has current callbacks/data
    const indexRef = useRef(index);
    const dataRef = useRef(data);
    const onSwipeRightRef = useRef(onSwipeRight);
    const onSwipeLeftRef = useRef(onSwipeLeft);
    const onRunOutOfCardsRef = useRef(onRunOutOfCards);
    const onIndexChangeRef = useRef(onIndexChange);

    useEffect(() => {
      indexRef.current = index;
    }, [index]);
    useEffect(() => {
      dataRef.current = data;
    }, [data]);
    useEffect(() => {
      onSwipeRightRef.current = onSwipeRight;
    }, [onSwipeRight]);
    useEffect(() => {
      onSwipeLeftRef.current = onSwipeLeft;
    }, [onSwipeLeft]);
    useEffect(() => {
      onRunOutOfCardsRef.current = onRunOutOfCards;
    }, [onRunOutOfCards]);
    useEffect(() => {
      onIndexChangeRef.current = onIndexChange;
    }, [onIndexChange]);

    // Reset when data changes
    useEffect(() => {
      setIndex(0);
      offset.value = 0;
      isTransitioning.value = false;
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

    const commitTransition = useCallback(
      (newIndex: number) => {
        setIndex(newIndex);
        offset.value = 0;
        isTransitioning.value = false;
      },
      [offset, isTransitioning],
    );

    const finishSession = useCallback(() => {
      isTransitioning.value = false;
      onRunOutOfCardsRef.current?.();
    }, [isTransitioning]);

    /** Navigate to the next word (right swipe semantics). */
    const goNext = useCallback(() => {
      if (isTransitioning.value) return;
      const current = indexRef.current;
      const items = dataRef.current;

      onSwipeRightRef.current?.(items[current]);

      if (current >= items.length - 1) {
        // Last card — animate it away then finish
        isTransitioning.value = true;
        offset.value = withTiming(
          SCREEN_WIDTH,
          { duration: TRANSITION_DURATION },
          (finished) => {
            "worklet";
            if (finished) {
              runOnJS(finishSession)();
            }
          },
        );
        return;
      }

      const nextIdx = current + 1;
      onIndexChangeRef.current?.(nextIdx);
      isTransitioning.value = true;
      offset.value = withTiming(
        SCREEN_WIDTH,
        { duration: TRANSITION_DURATION },
        (finished) => {
          "worklet";
          if (finished) {
            runOnJS(commitTransition)(nextIdx);
          }
        },
      );
    }, [offset, isTransitioning, commitTransition, finishSession]);

    /** Navigate to the previous word (left swipe semantics). */
    const goPrev = useCallback(() => {
      if (isTransitioning.value) return;
      const current = indexRef.current;
      if (current <= 0) {
        // Nothing to go back to — snap back
        offset.value = withSpring(0);
        return;
      }

      // Going back is pure navigation — we intentionally do NOT call onSwipeLeft
      // (consistent with TinderSwipe rewind mode which also skips that callback).
      const prevIdx = current - 1;
      onIndexChangeRef.current?.(prevIdx);
      isTransitioning.value = true;
      offset.value = withTiming(
        -SCREEN_WIDTH,
        { duration: TRANSITION_DURATION },
        (finished) => {
          "worklet";
          if (finished) {
            runOnJS(commitTransition)(prevIdx);
          }
        },
      );
    }, [offset, isTransitioning, commitTransition]);

    useImperativeHandle(ref, () => ({ goNext, goPrev }));

    // Stable refs for gesture handler to avoid stale closure issues
    const goNextRef = useRef(goNext);
    const goPrevRef = useRef(goPrev);
    useEffect(() => {
      goNextRef.current = goNext;
    }, [goNext]);
    useEffect(() => {
      goPrevRef.current = goPrev;
    }, [goPrev]);

    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        if (isTransitioning.value) return;
        offset.value = e.translationX;
      })
      .onEnd((e) => {
        if (isTransitioning.value) return;
        if (e.translationX > SWIPE_THRESHOLD) {
          runOnJS(() => goNextRef.current())();
        } else if (e.translationX < -SWIPE_THRESHOLD) {
          runOnJS(() => goPrevRef.current())();
        } else {
          offset.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      });

    // Animated positions:
    //   current card → offset
    //   next card    → -SCREEN_WIDTH + offset  (appears from left on right swipe)
    //   prev card    → +SCREEN_WIDTH + offset  (appears from right on left swipe)
    const currentStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: offset.value }],
    }));
    const nextStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: -SCREEN_WIDTH + offset.value }],
    }));
    const prevStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: SCREEN_WIDTH + offset.value }],
    }));

    const prevIndex = index - 1;
    const nextIndex = index + 1;

    if (!data || data.length === 0) return null;

    return (
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          {/* Prev card — positioned to the right */}
          {prevIndex >= 0 && (
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.cardWrapper, prevStyle]}
            >
              {renderCard(data[prevIndex])}
            </Animated.View>
          )}
          {/* Next card — positioned to the left */}
          {nextIndex < data.length && (
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.cardWrapper, nextStyle]}
            >
              {renderCard(data[nextIndex])}
            </Animated.View>
          )}
          {/* Current card — centre, rendered last so it's on top */}
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.cardWrapper, currentStyle]}
          >
            {renderCard(data[index])}
          </Animated.View>
        </View>
      </GestureDetector>
    );
  },
);

CarouselSwipe.displayName = "CarouselSwipe";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  cardWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useCallback } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { SwipeCardItem } from "../../swipe/SwipeCardItem";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const PEEK = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const SNAP_INTERVAL = CARD_WIDTH;

const SPRING = { damping: 22, stiffness: 200, mass: 0.8 };

// ─────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────

interface CarouselSwipeDeckProps {
  cards: VocabularyCard[];
  dayNumber: number;
  savedWordIds: Set<string>;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
}

// ─────────────────────────────────────────────────────────────
// CardItem — animated per-card wrapper
// ─────────────────────────────────────────────────────────────

interface CardItemProps {
  item: VocabularyCard;
  index: number;
  translateX: SharedValue<number>;
  savedWordIds: Set<string>;
  dayNumber: number;
  onSavedWordChange?: (wordId: string, isSaved: boolean) => void;
}

const CardItem = React.memo(function CardItem({
  item,
  index,
  translateX,
  savedWordIds,
  dayNumber,
  onSavedWordChange,
}: CardItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scrollPos = -translateX.value;
    const center = index * SNAP_INTERVAL;
    const inputRange = [center - SNAP_INTERVAL, center, center + SNAP_INTERVAL];
    const scale = interpolate(scrollPos, inputRange, [0.93, 1, 0.93], "clamp");
    const opacity = interpolate(scrollPos, inputRange, [0.5, 1, 0.5], "clamp");
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[styles.cardSlot, animatedStyle]}>
      <SwipeCardItem
        item={item}
        initialIsSaved={savedWordIds.has(item.id)}
        day={dayNumber}
        onSavedWordChange={onSavedWordChange}
      />
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// CarouselSwipeDeck
// ─────────────────────────────────────────────────────────────

export const CarouselSwipeDeck: React.FC<CarouselSwipeDeckProps> = ({
  cards,
  dayNumber,
  savedWordIds,
  onSavedWordChange,
  onSwipeRight,
  onSwipeLeft,
  onIndexChange,
  onFinish,
}) => {
  const translateX = useSharedValue(0);
  // Use shared value instead of ref so it's readable inside worklets
  const currentIndex = useSharedValue(0);
  const maxIndex = cards.length - 1;

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: PEEK + translateX.value }],
  }));

  // Called from the UI thread via runOnJS — fires JS callbacks
  const navigateTo = useCallback(
    (prevIndex: number, nextIndex: number) => {
      if (nextIndex === prevIndex) return;
      if (nextIndex > prevIndex) {
        onSwipeLeft(cards[nextIndex] ?? cards[prevIndex]);
      } else {
        onSwipeRight(cards[nextIndex]);
      }
      onIndexChange(nextIndex);
    },
    [cards, onSwipeLeft, onSwipeRight, onIndexChange],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      "worklet";
      const base = -(currentIndex.value * SNAP_INTERVAL);
      const raw = base + event.translationX;
      const min = -(maxIndex * SNAP_INTERVAL);
      const max = 0;
      translateX.value =
        raw > max
          ? max + (raw - max) * 0.2
          : raw < min
            ? min + (raw - min) * 0.2
            : raw;
    })
    .onEnd((event) => {
      "worklet";
      const { translationX: tx, velocityX: vx } = event;
      const current = currentIndex.value;

      let target = current;
      if (vx < -300 || tx < -SNAP_INTERVAL * 0.3) {
        if (current === maxIndex) {
          translateX.value = withSpring(
            -(maxIndex * SNAP_INTERVAL + SCREEN_WIDTH),
            SPRING,
            (finished) => {
              "worklet";
              if (finished) runOnJS(onFinish)();
            },
          );
          return;
        }
        target = current + 1;
      } else if (vx > 300 || tx > SNAP_INTERVAL * 0.3) {
        target = Math.max(0, current - 1);
      }

      currentIndex.value = target;
      translateX.value = withSpring(-target * SNAP_INTERVAL, SPRING);
      runOnJS(navigateTo)(current, target);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.row, rowStyle]}>
          {cards.map((item, index) => (
            <CardItem
              key={item.id}
              item={item}
              index={index}
              translateX={translateX}
              savedWordIds={savedWordIds}
              dayNumber={dayNumber}
              onSavedWordChange={onSavedWordChange}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  row: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
  },
  cardSlot: {
    width: CARD_WIDTH,
  },
});

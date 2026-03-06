import React, { useCallback, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
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
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  renderFinishView?: () => React.ReactNode;
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
}

const CardItem = React.memo(function CardItem({
  item,
  index,
  translateX,
  savedWordIds,
  dayNumber,
}: CardItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // scrollPos: 0 at card 0, SNAP_INTERVAL at card 1, etc.
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
  onSwipeRight,
  onSwipeLeft,
  onIndexChange,
  onFinish,
  renderFinishView,
}) => {
  const translateX = useSharedValue(0);
  const currentIndexRef = useRef(0);
  const totalItems = renderFinishView ? cards.length + 1 : cards.length;
  const maxIndex = totalItems - 1;

  // Translate the entire row: starts at PEEK so card 0 is centered
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: PEEK + translateX.value }],
  }));

  const navigateTo = useCallback(
    (nextIndex: number) => {
      const prevIndex = currentIndexRef.current;
      if (nextIndex === prevIndex) return;

      if (nextIndex < cards.length) {
        if (nextIndex > prevIndex) {
          onSwipeLeft(cards[nextIndex]);
        } else {
          onSwipeRight(cards[nextIndex]);
        }
        onIndexChange(nextIndex);
      } else if (renderFinishView && nextIndex === cards.length) {
        onFinish();
      }
      currentIndexRef.current = nextIndex;
    },
    [cards, onSwipeLeft, onSwipeRight, onIndexChange, onFinish, renderFinishView],
  );

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      const base = -(currentIndexRef.current * SNAP_INTERVAL);
      const raw = base + event.translationX;
      const min = -(maxIndex * SNAP_INTERVAL);
      const max = 0;
      // Rubber-band resistance at the edges
      translateX.value =
        raw > max ? max + (raw - max) * 0.2
        : raw < min ? min + (raw - min) * 0.2
        : raw;
    })
    .onEnd((event) => {
      const { translationX: tx, velocityX: vx } = event;
      const current = currentIndexRef.current;

      let target = current;
      if (vx < -300 || tx < -SNAP_INTERVAL * 0.3) {
        target = Math.min(maxIndex, current + 1); // swipe left → next
      } else if (vx > 300 || tx > SNAP_INTERVAL * 0.3) {
        target = Math.max(0, current - 1); // swipe right → previous
      }

      translateX.value = withSpring(-target * SNAP_INTERVAL, SPRING);
      navigateTo(target);
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
            />
          ))}
          {renderFinishView && (
            <View style={styles.cardSlot}>{renderFinishView()}</View>
          )}
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
  // Absolutely positioned so it isn't width-constrained by the parent,
  // letting flexDirection:"row" size it to fit all cards naturally.
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

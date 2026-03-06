import React, { useCallback, useRef } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { SwipeCardItem } from "../../swipe/SwipeCardItem";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Each card occupies 90% of screen width (matches SwipeCardItem's internal width)
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
// Remaining space split to each side → shows a peek of adjacent cards
const PEEK = (SCREEN_WIDTH - CARD_WIDTH) / 2;
// Snap interval equals card width (no gap; peek provides the visual separation)
const SNAP_INTERVAL = CARD_WIDTH;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlatList = Animated.createAnimatedComponent<any>(FlatList);

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

type DataItem = VocabularyCard | { id: "__finish__" };

// ─────────────────────────────────────────────────────────────
// CardItem — animated per-card wrapper
// ─────────────────────────────────────────────────────────────

interface CardItemProps {
  item: VocabularyCard;
  index: number;
  scrollX: SharedValue<number>;
  savedWordIds: Set<string>;
  dayNumber: number;
}

const CardItem = React.memo(function CardItem({
  item,
  index,
  scrollX,
  savedWordIds,
  dayNumber,
}: CardItemProps) {
  const center = index * SNAP_INTERVAL;

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [center - SNAP_INTERVAL, center, center + SNAP_INTERVAL];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.93, 1, 0.93],
      "clamp",
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      "clamp",
    );
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
// CarouselSwipeDeck — main component
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
  const scrollX = useSharedValue(0);
  const currentIndexRef = useRef(0);

  const data: DataItem[] = renderFinishView
    ? [...cards, { id: "__finish__" }]
    : cards;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = useCallback(
    (e: any) => {
      const newIndex = Math.round(
        e.nativeEvent.contentOffset.x / SNAP_INTERVAL,
      );
      const previousIndex = currentIndexRef.current;
      if (newIndex === previousIndex) return;

      if (newIndex < cards.length) {
        if (newIndex > previousIndex) {
          // Swiped left → next word
          onSwipeLeft(cards[newIndex]);
        } else {
          // Swiped right → previous word
          onSwipeRight(cards[newIndex]);
        }
        onIndexChange(newIndex);
      } else if (renderFinishView && newIndex === cards.length) {
        onFinish();
      }

      currentIndexRef.current = newIndex;
    },
    [cards, onSwipeLeft, onSwipeRight, onIndexChange, onFinish, renderFinishView],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DataItem; index: number }) => {
      if (item.id === "__finish__") {
        return <View style={styles.cardSlot}>{renderFinishView?.()}</View>;
      }
      return (
        <CardItem
          item={item as VocabularyCard}
          index={index}
          scrollX={scrollX}
          savedWordIds={savedWordIds}
          dayNumber={dayNumber}
        />
      );
    },
    [scrollX, savedWordIds, dayNumber, renderFinishView],
  );

  const keyExtractor = useCallback((item: DataItem) => item.id, []);

  return (
    <View style={styles.container}>
      <AnimatedFlatList
        style={styles.list}
        horizontal
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PEEK }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialNumToRender={3}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  list: {
    flex: 1,
  },
  cardSlot: {
    width: CARD_WIDTH,
  },
});

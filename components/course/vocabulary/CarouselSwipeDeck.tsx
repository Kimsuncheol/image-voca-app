import React from "react";
import { StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { VocabularyCard } from "../../../src/types/vocabulary";
import { SwipeCardItem } from "../../swipe/SwipeCardItem";

interface CarouselSwipeDeckProps {
  cards: VocabularyCard[];
  isDark: boolean;
  dayNumber: number;
  savedWordIds: Set<string>;
  onSwipeRight: (item: VocabularyCard) => void;
  onSwipeLeft: (item: VocabularyCard) => void;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  renderFinishView?: () => React.ReactNode;
}

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
  const currentIndexRef = React.useRef(0);

  const handlePageSelected = React.useCallback(
    (e: any) => {
      const nextIndex = e.nativeEvent.position;
      const previousIndex = currentIndexRef.current;

      if (nextIndex > previousIndex) {
        // Swiped left → moving forward to next word
        if (nextIndex < cards.length) {
          onSwipeLeft(cards[nextIndex]);
          onIndexChange(nextIndex);
        }
        if (renderFinishView && nextIndex === cards.length) {
          onFinish();
        }
      } else if (nextIndex < previousIndex) {
        // Swiped right → moving back to previous word
        if (nextIndex < cards.length) {
          onSwipeRight(cards[nextIndex]);
          onIndexChange(nextIndex);
        }
      }

      currentIndexRef.current = nextIndex;
    },
    [cards, onSwipeLeft, onSwipeRight, onIndexChange, onFinish, renderFinishView],
  );

  return (
    <PagerView
      style={styles.pagerView}
      initialPage={0}
      onPageSelected={handlePageSelected}
    >
      {cards.map((item) => (
        <View key={item.id} style={styles.page}>
          <SwipeCardItem
            item={item}
            initialIsSaved={savedWordIds.has(item.id)}
            day={dayNumber}
          />
        </View>
      ))}
      {renderFinishView && (
        <View key="final-page" style={styles.page}>
          {renderFinishView()}
        </View>
      )}
    </PagerView>
  );
};

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
    width: "100%",
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

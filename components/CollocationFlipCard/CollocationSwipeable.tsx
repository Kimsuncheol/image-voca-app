import React from "react";
import { StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
import { VocabularyCard } from "../../src/types/vocabulary";
import { CollocationFlipCard } from "./index";

interface Props {
  data: VocabularyCard[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onFinish?: () => void;
  renderFinalPage?: () => React.ReactNode;
  isDark?: boolean;
  day?: number;
  savedWordIds?: Set<string>;
}

export const CollocationSwipeable: React.FC<Props> = ({
  data,
  initialIndex = 0,
  onIndexChange,
  onFinish,
  renderFinalPage,
  isDark = false,
  day,
  savedWordIds,
}) => {
  const normalizedInitialIndex =
    initialIndex <= data.length ? initialIndex : Math.max(0, data.length - 1);
  const pagerRef = React.useRef<PagerView>(null);
  const currentIndexRef = React.useRef(normalizedInitialIndex);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const revertingTargetRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    currentIndexRef.current = normalizedInitialIndex;
    unlockedIndicesRef.current = new Set();
    revertingTargetRef.current = null;
  }, [normalizedInitialIndex, data.length]);

  const unlockIndex = React.useCallback((index: number) => {
    unlockedIndicesRef.current.add(index);
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
      const isForwardMove = nextIndex > previousIndex;
      const isCurrentCardUnlocked =
        unlockedIndicesRef.current.has(previousIndex);

      // Forward navigation is blocked until current card has been flipped once.
      if (isForwardMove && !isCurrentCardUnlocked) {
        revertingTargetRef.current = previousIndex;
        pagerRef.current?.setPageWithoutAnimation(previousIndex);
        return;
      }

      currentIndexRef.current = nextIndex;
      onIndexChange?.(nextIndex);

      // If we have a final page and we reached it, trigger onFinish.
      if (renderFinalPage && nextIndex === data.length) {
        onFinish?.();
      }
    },
    [data.length, onFinish, onIndexChange, renderFinalPage],
  );

  const handleCardFirstFlip = React.useCallback((index: number) => {
    // Keep unlock persistent while this pager session is mounted.
    unlockIndex(index);
  }, [unlockIndex]);

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pagerView}
      initialPage={normalizedInitialIndex}
      onPageSelected={handlePageSelected}
      orientation="horizontal"
    >
      {data.map((item, index) => (
        <View key={item.id} style={styles.page}>
          <CollocationFlipCard
            data={{
              collocation: item.word,
              meaning: item.meaning,
              explanation: item.pronunciation || "",
              example: item.example,
              translation: item.translation || "",
            }}
            isDark={isDark}
            wordBankConfig={{
              id: item.id,
              course: item.course,
              day,
              initialIsSaved: savedWordIds?.has(item.id) ?? false,
              enableAdd: true,
              enableDelete: false,
            }}
            onFirstFlipToBack={() => handleCardFirstFlip(index)}
          />
        </View>
      ))}
      {renderFinalPage && (
        <View key="final-page" style={styles.page}>
          {renderFinalPage()}
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

export default CollocationSwipeable;

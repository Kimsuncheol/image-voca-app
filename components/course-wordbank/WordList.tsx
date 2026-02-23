import React from "react";
import { StyleSheet, View } from "react-native";
import PagerView from "react-native-pager-view";
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

export function WordList({
  words,
  courseId,
  courseColor,
  isDark,
  onDelete,
}: WordListProps) {
  const pagerRef = React.useRef<PagerView>(null);
  const currentIndexRef = React.useRef(0);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const revertingTargetRef = React.useRef<number | null>(null);
  const isBlockingForwardDragRef = React.useRef(false);

  React.useEffect(() => {
    currentIndexRef.current = 0;
    unlockedIndicesRef.current = new Set();
    revertingTargetRef.current = null;
    isBlockingForwardDragRef.current = false;
  }, [courseId, words.length]);

  const unlockIndex = React.useCallback((index: number) => {
    unlockedIndicesRef.current.add(index);
  }, []);

  // Block feedback has been removed as it is no longer used in Word Bank

  const blockForwardFromIndex = React.useCallback((index: number) => {
    // In Word Bank (where WordList is used), we NEVER block swiping to the next card,
    // so simply always return false.
    return false;
  }, []);

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

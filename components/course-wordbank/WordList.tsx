import React from "react";
import PagerView from "react-native-pager-view";
import { StyleSheet, View } from "react-native";
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
  const pagerRef = React.useRef<PagerView>(null);
  const currentIndexRef = React.useRef(0);
  const unlockedIndicesRef = React.useRef<Set<number>>(new Set());
  const revertingTargetRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    currentIndexRef.current = 0;
    unlockedIndicesRef.current = new Set();
    revertingTargetRef.current = null;
  }, [courseId, words.length]);

  const unlockIndex = React.useCallback((index: number) => {
    unlockedIndicesRef.current.add(index);
  }, []);

  const handlePageSelected = React.useCallback((e: any) => {
    const nextIndex = e.nativeEvent.position;

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

    if (isForwardMove && !isCurrentCardUnlocked) {
      revertingTargetRef.current = previousIndex;
      pagerRef.current?.setPageWithoutAnimation(previousIndex);
      return;
    }

    currentIndexRef.current = nextIndex;
  }, []);

  // COLLOCATION course uses special flip card design
  if (courseId === "COLLOCATION") {
    return (
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
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

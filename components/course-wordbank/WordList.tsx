import React from "react";
import { View } from "react-native";
import { SwipeToDeleteRow } from "./SwipeToDeleteRow";
import { SavedWord, WordCard } from "../wordbank/WordCard";

interface WordListProps {
  words: SavedWord[];
  courseId: string;
  courseColor?: string;
  isDark: boolean;
  onDeleteWord: (wordId: string) => void;
}

export function WordList({
  words,
  courseId,
  courseColor,
  isDark,
  onDeleteWord,
}: WordListProps) {
  const showPronunciation = courseId !== "COLLOCATION";

  return (
    <View>
      {words.map((word, index) => (
        <SwipeToDeleteRow
          key={word.id}
          itemId={word.id}
          isDark={isDark}
          onDelete={onDeleteWord}
        >
          <WordCard
            word={word}
            courseColor={courseColor}
            isDark={isDark}
            showPronunciation={showPronunciation}
          />
        </SwipeToDeleteRow>
      ))}
    </View>
  );
}

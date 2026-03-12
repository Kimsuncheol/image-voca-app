import React from "react";
import { View } from "react-native";
import { SavedWord, WordCard } from "../wordbank/WordCard";

interface WordListProps {
  words: SavedWord[];
  courseId: string;
  courseColor?: string;
  isDark: boolean;
  isDeleteMode: boolean;
  selectedIds: Set<string>;
  onStartDeleteMode: (wordId: string) => void;
  onToggleSelection: (wordId: string) => void;
}

export function WordList({
  words,
  courseId,
  courseColor,
  isDark,
  isDeleteMode,
  selectedIds,
  onStartDeleteMode,
  onToggleSelection,
}: WordListProps) {
  const showPronunciation = courseId !== "COLLOCATION";

  return (
    <View>
      {words.map((word, index) => (
        <WordCard
          key={word.id + index}
          word={word}
          courseColor={courseColor}
          isDark={isDark}
          showPronunciation={showPronunciation}
          isDeleteMode={isDeleteMode}
          isSelected={selectedIds.has(word.id)}
          onStartDeleteMode={onStartDeleteMode}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </View>
  );
}

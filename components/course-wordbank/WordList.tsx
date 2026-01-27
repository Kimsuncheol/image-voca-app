import React from "react";
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
  // COLLOCATION course uses special flip card design
  if (courseId === "COLLOCATION") {
    return (
      <>
        {words.map((word, index) => (
          <CollocationFlipCard
            key={`${word.id}-${index}`}
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
          />
        ))}
      </>
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

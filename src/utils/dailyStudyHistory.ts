import { CourseType } from "../types/vocabulary";

export interface VocabularyDayStudyEntry {
  courseId: CourseType;
  dayNumber: number;
  wordsLearned: number;
  totalWords: number;
  completedAt: string;
}

export interface DailyStudyHistoryDoc {
  date: string;
  vocabularyDays: VocabularyDayStudyEntry[];
  updatedAt: string;
}

export const sortVocabularyDays = (
  entries: VocabularyDayStudyEntry[],
): VocabularyDayStudyEntry[] =>
  [...entries].sort(
    (left, right) =>
      new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  );

export const buildUpsertedDailyStudyHistoryDoc = ({
  existingDoc,
  date,
  entry,
  updatedAt,
}: {
  existingDoc: DailyStudyHistoryDoc | null;
  date: string;
  entry: VocabularyDayStudyEntry;
  updatedAt: string;
}): DailyStudyHistoryDoc => {
  const existingEntries = existingDoc?.vocabularyDays ?? [];
  const vocabularyDays = sortVocabularyDays([
    ...existingEntries.filter(
      (existingEntry) =>
        !(
          existingEntry.courseId === entry.courseId &&
          existingEntry.dayNumber === entry.dayNumber
        ),
    ),
    entry,
  ]);

  return {
    date,
    vocabularyDays,
    updatedAt,
  };
};

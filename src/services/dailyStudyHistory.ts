import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  DailyStudyHistoryDoc,
  VocabularyDayStudyEntry,
  buildUpsertedDailyStudyHistoryDoc,
  sortVocabularyDays,
} from "../utils/dailyStudyHistory";

export type { DailyStudyHistoryDoc, VocabularyDayStudyEntry };

const normalizeVocabularyDayEntry = (
  value: unknown,
): VocabularyDayStudyEntry | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Record<string, unknown>;
  if (
    typeof entry.courseId !== "string" ||
    typeof entry.dayNumber !== "number" ||
    typeof entry.wordsLearned !== "number" ||
    typeof entry.totalWords !== "number" ||
    typeof entry.completedAt !== "string"
  ) {
    return null;
  }

  return {
    courseId: entry.courseId as CourseType,
    dayNumber: entry.dayNumber,
    wordsLearned: entry.wordsLearned,
    totalWords: entry.totalWords,
    completedAt: entry.completedAt,
  };
};

const normalizeDailyStudyHistoryDoc = (
  date: string,
  value: unknown,
): DailyStudyHistoryDoc | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const vocabularyDays = Array.isArray(raw.vocabularyDays)
    ? raw.vocabularyDays
        .map(normalizeVocabularyDayEntry)
        .filter((entry): entry is VocabularyDayStudyEntry => entry !== null)
    : [];

  return {
    date: typeof raw.date === "string" ? raw.date : date,
    vocabularyDays: sortVocabularyDays(vocabularyDays),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
};

export const fetchDailyStudyHistory = async (
  userId: string,
  date: string,
): Promise<DailyStudyHistoryDoc | null> => {
  const historyRef = doc(db, "users", userId, "dailyStudyHistory", date);
  const historySnap = await getDoc(historyRef);

  if (!historySnap.exists()) {
    return null;
  }

  return normalizeDailyStudyHistoryDoc(date, historySnap.data());
};

export const upsertVocabularyDayStudyHistory = async ({
  userId,
  date,
  entry,
}: {
  userId: string;
  date: string;
  entry: VocabularyDayStudyEntry;
}): Promise<DailyStudyHistoryDoc> => {
  const historyRef = doc(db, "users", userId, "dailyStudyHistory", date);
  const historySnap = await getDoc(historyRef);
  const existingDoc = historySnap.exists()
    ? normalizeDailyStudyHistoryDoc(date, historySnap.data())
    : null;
  const nextDoc = buildUpsertedDailyStudyHistoryDoc({
    existingDoc,
    date,
    entry,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(historyRef, nextDoc, { merge: true });
  return nextDoc;
};

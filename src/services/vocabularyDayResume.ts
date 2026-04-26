import AsyncStorage from "@react-native-async-storage/async-storage";
import { CourseType, CourseVocabularyCard } from "../types/vocabulary";

const STORAGE_PREFIX = "voca:vocabulary-day-resume";

export interface VocabularyDayResumeProgress {
  courseId: CourseType;
  dayNumber: number;
  currentIndex: number;
  cardId: string;
  updatedAt: string;
}

const makeStorageKey = (
  userId: string,
  courseId: CourseType,
  dayNumber: number,
) => `${STORAGE_PREFIX}:${userId}:${courseId}:Day${dayNumber}`;

const normalizeIndex = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const index = Math.floor(value);
  return index >= 0 ? index : null;
};

export const validateResumeProgress = ({
  value,
  courseId,
  dayNumber,
  cards,
}: {
  value: unknown;
  courseId: CourseType;
  dayNumber: number;
  cards: CourseVocabularyCard[];
}): VocabularyDayResumeProgress | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const currentIndex = normalizeIndex(candidate.currentIndex);
  const cardId = typeof candidate.cardId === "string" ? candidate.cardId : "";
  const updatedAt =
    typeof candidate.updatedAt === "string" ? candidate.updatedAt : "";

  if (
    candidate.courseId !== courseId ||
    candidate.dayNumber !== dayNumber ||
    currentIndex === null ||
    currentIndex >= cards.length ||
    cardId.length === 0 ||
    cards[currentIndex]?.id !== cardId ||
    updatedAt.length === 0
  ) {
    return null;
  }

  return {
    courseId,
    dayNumber,
    currentIndex,
    cardId,
    updatedAt,
  };
};

export const getResumeProgress = async ({
  userId,
  courseId,
  dayNumber,
  cards,
}: {
  userId: string;
  courseId: CourseType;
  dayNumber: number;
  cards: CourseVocabularyCard[];
}): Promise<VocabularyDayResumeProgress | null> => {
  const raw = await AsyncStorage.getItem(
    makeStorageKey(userId, courseId, dayNumber),
  );
  if (!raw) return null;

  try {
    return validateResumeProgress({
      value: JSON.parse(raw),
      courseId,
      dayNumber,
      cards,
    });
  } catch {
    return null;
  }
};

export const saveResumeProgress = async ({
  userId,
  courseId,
  dayNumber,
  cards,
  currentIndex,
}: {
  userId: string;
  courseId: CourseType;
  dayNumber: number;
  cards: CourseVocabularyCard[];
  currentIndex: number;
}): Promise<VocabularyDayResumeProgress | null> => {
  const card = cards[currentIndex];
  if (!card) return null;

  const progress: VocabularyDayResumeProgress = {
    courseId,
    dayNumber,
    currentIndex,
    cardId: card.id,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    makeStorageKey(userId, courseId, dayNumber),
    JSON.stringify(progress),
  );

  return progress;
};

export const clearResumeProgress = async ({
  userId,
  courseId,
  dayNumber,
}: {
  userId: string;
  courseId: CourseType;
  dayNumber: number;
}) => {
  await AsyncStorage.removeItem(makeStorageKey(userId, courseId, dayNumber));
};

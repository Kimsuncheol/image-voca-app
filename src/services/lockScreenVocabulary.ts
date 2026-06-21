import { Platform } from "react-native";

import LockScreenVocabularyModule from "../../modules/lock-screen-vocabulary";
import type { CourseProgress } from "../stores/userStatsStore";
import {
  CourseType,
  CourseVocabularyCard,
  LearningLanguage,
  isKanjiWord,
} from "../types/vocabulary";
import { resolveVocabularyContent } from "../utils/localizedVocabulary";
import { syncAndroidLockScreenVocabularyNotification } from "../utils/notifications";
import { getLockScreenStudyPreferences } from "./lockScreenStudyPreferences";
import {
  getTotalDaysForCourse,
  prefetchVocabularyCards,
} from "./vocabularyPrefetch";

export const LOCK_SCREEN_VOCABULARY_APP_GROUP_ID =
  "group.com.benjaminkim96.imagevocaapp.lockscreen-vocabulary";
export const LOCK_SCREEN_VOCABULARY_STORAGE_KEY =
  "lockScreenVocabularyPayload";

export type RecentCourseByLanguage = Partial<Record<LearningLanguage, CourseType>>;

export interface LockScreenVocabularyTarget {
  courseId: CourseType;
  dayNumber: number;
  isReviewFallback: boolean;
}

export interface LockScreenVocabularyPayload {
  schemaVersion: 1;
  courseId: CourseType;
  dayNumber: number;
  cardId: string;
  word: string;
  pronunciation?: string;
  meaning?: string;
  meaningHidden: boolean;
  updatedAt: string;
  deepLink: string;
}

interface ResolveTargetInput {
  learningLanguage: LearningLanguage;
  recentCourseByLanguage: RecentCourseByLanguage;
  courseProgress?: CourseProgress;
  totalDays: number;
}

interface BuildPayloadInput {
  courseId: CourseType;
  dayNumber: number;
  card: CourseVocabularyCard;
  displayLanguage?: string;
  showMeaning?: boolean;
  now?: Date;
}

interface RefreshPayloadInput {
  learningLanguage: LearningLanguage;
  recentCourseByLanguage: RecentCourseByLanguage;
  courseProgressByCourse?: Record<string, CourseProgress>;
  displayLanguage?: string;
  showMeaning?: boolean;
  fetchCourseProgress?: (courseId: CourseType) => Promise<CourseProgress | undefined>;
}

const normalizePositiveInteger = (value: number) =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

export const resolveFirstIncompleteDay = (
  courseProgress: CourseProgress | undefined,
  totalDays: number,
) => {
  const normalizedTotalDays = normalizePositiveInteger(totalDays);
  if (normalizedTotalDays === 0) return null;

  for (let day = 1; day <= normalizedTotalDays; day += 1) {
    if (!courseProgress?.[day]?.completed) {
      return {
        dayNumber: day,
        isReviewFallback: false,
      };
    }
  }

  return {
    dayNumber: normalizedTotalDays,
    isReviewFallback: true,
  };
};

export const resolveLockScreenVocabularyTarget = ({
  learningLanguage,
  recentCourseByLanguage,
  courseProgress,
  totalDays,
}: ResolveTargetInput): LockScreenVocabularyTarget | null => {
  const courseId = recentCourseByLanguage[learningLanguage];
  if (!courseId) return null;

  const day = resolveFirstIncompleteDay(courseProgress, totalDays);
  if (!day) return null;

  return {
    courseId,
    dayNumber: day.dayNumber,
    isReviewFallback: day.isReviewFallback,
  };
};

export const createLockScreenVocabularyDeepLink = (
  courseId: CourseType,
  dayNumber: number,
) =>
  `imagevocaapp://course/${encodeURIComponent(courseId)}/vocabulary?day=${encodeURIComponent(
    String(dayNumber),
  )}`;

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getKanjiPayloadContent = (card: CourseVocabularyCard) => {
  if (!isKanjiWord(card)) return null;

  return {
    id: card.id,
    word: normalizeText(card.kanji) ?? "",
    pronunciation: normalizeText(card.reading?.[0]),
    meaning:
      normalizeText(card.meaning?.[0]) ??
      normalizeText(card.meaningKorean?.[0]),
  };
};

const getVocabularyPayloadContent = (
  card: CourseVocabularyCard,
  displayLanguage?: string,
) => {
  if (isKanjiWord(card)) return null;

  const resolved = resolveVocabularyContent(card, displayLanguage);
  return {
    id: card.id,
    word: normalizeText(resolved.word) ?? normalizeText(card.word) ?? "",
    pronunciation:
      normalizeText(resolved.localizedPronunciation) ??
      normalizeText(resolved.sharedPronunciation) ??
      normalizeText(resolved.pronunciationRoman),
    meaning: normalizeText(resolved.meaning) ?? normalizeText(card.meaning),
  };
};

export const buildLockScreenVocabularyPayload = ({
  courseId,
  dayNumber,
  card,
  displayLanguage = "en",
  showMeaning = false,
  now = new Date(),
}: BuildPayloadInput): LockScreenVocabularyPayload | null => {
  const content =
    getKanjiPayloadContent(card) ??
    getVocabularyPayloadContent(card, displayLanguage);

  if (!content?.word) return null;

  return {
    schemaVersion: 1,
    courseId,
    dayNumber,
    cardId: content.id,
    word: content.word,
    pronunciation: content.pronunciation,
    meaning: showMeaning ? content.meaning : undefined,
    meaningHidden: !showMeaning,
    updatedAt: now.toISOString(),
    deepLink: createLockScreenVocabularyDeepLink(courseId, dayNumber),
  };
};

export const writeLockScreenVocabularyPayload = async (
  payload: LockScreenVocabularyPayload | null,
) => {
  if (Platform.OS !== "ios" || !LockScreenVocabularyModule) {
    return false;
  }

  await LockScreenVocabularyModule.setPayload(
    LOCK_SCREEN_VOCABULARY_APP_GROUP_ID,
    LOCK_SCREEN_VOCABULARY_STORAGE_KEY,
    payload ? JSON.stringify(payload) : null,
  );
  return true;
};

export const publishLockScreenVocabularyPayload = async (
  payload: LockScreenVocabularyPayload | null,
) => {
  const [wroteIosPayload, syncedAndroidNotification] = await Promise.all([
    writeLockScreenVocabularyPayload(payload),
    syncAndroidLockScreenVocabularyNotification(payload),
  ]);

  return wroteIosPayload || syncedAndroidNotification;
};

export const refreshLockScreenVocabularyPayload = async ({
  learningLanguage,
  recentCourseByLanguage,
  courseProgressByCourse,
  displayLanguage,
  showMeaning,
  fetchCourseProgress,
}: RefreshPayloadInput) => {
  const courseId = recentCourseByLanguage[learningLanguage];
  if (!courseId) {
    await publishLockScreenVocabularyPayload(null);
    return null;
  }

  const [totalDays, fetchedProgress] = await Promise.all([
    getTotalDaysForCourse(courseId),
    courseProgressByCourse?.[courseId]
      ? Promise.resolve(courseProgressByCourse[courseId])
      : fetchCourseProgress?.(courseId),
  ]);

  const target = resolveLockScreenVocabularyTarget({
    learningLanguage,
    recentCourseByLanguage,
    courseProgress: fetchedProgress ?? courseProgressByCourse?.[courseId],
    totalDays,
  });

  if (!target) {
    await publishLockScreenVocabularyPayload(null);
    return null;
  }

  const cards = await prefetchVocabularyCards(target.courseId, target.dayNumber, {
    allowStale: true,
    preferCache: true,
    revalidateIfStale: true,
  });
  const firstCard = cards[0];
  const payload = firstCard
    ? buildLockScreenVocabularyPayload({
        courseId: target.courseId,
        dayNumber: target.dayNumber,
        card: firstCard,
        displayLanguage,
        showMeaning,
      })
    : null;

  await publishLockScreenVocabularyPayload(payload);
  return payload;
};

export const syncLockScreenVocabularyPayload = async (
  input: RefreshPayloadInput,
) => {
  const preferences = await getLockScreenStudyPreferences();
  if (!preferences.studyOnLockScreenEnabled) {
    await publishLockScreenVocabularyPayload(null);
    return null;
  }

  return refreshLockScreenVocabularyPayload(input);
};

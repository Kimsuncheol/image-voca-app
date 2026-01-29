import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "./firebase";
import { CourseType, VocabularyCard } from "../types/vocabulary";

type CourseConfig = {
  path?: string;
  prefix?: string;
};

const STORAGE_PREFIX = "vocab_cache_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const vocabularyCache = new Map<string, VocabularyCard[]>();
const vocabularyCacheUpdatedAt = new Map<string, number>();

const getCourseConfig = (courseId: CourseType): CourseConfig => {
  switch (courseId) {
    case "수능":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT,
        prefix: "CSAT",
      };
    case "TOEIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC,
        prefix: "TOEIC",
      };
    case "TOEFL":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL,
        prefix: "TOEFL",
      };
    case "TOEIC_SPEAKING":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING,
        prefix: "TOEIC_SPEAKING",
      };
    case "IELTS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS,
        prefix: "IELTS",
      };
    case "OPIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_OPIC,
        prefix: "OPIC",
      };
    case "COLLOCATION":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION,
        prefix: "COLLOCATION",
      };
    default:
      return { path: "", prefix: "" };
  }
};

const makeCacheKey = (courseId: CourseType, dayNumber: number) =>
  `${courseId}-Day${dayNumber}`;

const makeStorageKey = (courseId: CourseType, dayNumber: number) =>
  `${STORAGE_PREFIX}:${makeCacheKey(courseId, dayNumber)}`;

const setCachedVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
  cards: VocabularyCard[],
  updatedAt = Date.now(),
) => {
  const key = makeCacheKey(courseId, dayNumber);
  vocabularyCache.set(key, cards);
  vocabularyCacheUpdatedAt.set(key, updatedAt);
};

export const getCachedVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
) => vocabularyCache.get(makeCacheKey(courseId, dayNumber));

export const getCachedVocabularyUpdatedAt = (
  courseId: CourseType,
  dayNumber: number,
) => vocabularyCacheUpdatedAt.get(makeCacheKey(courseId, dayNumber));

export const isVocabularyCacheFresh = (
  courseId: CourseType,
  dayNumber: number,
) => {
  const updatedAt = getCachedVocabularyUpdatedAt(courseId, dayNumber);
  if (!updatedAt) return false;
  return Date.now() - updatedAt < CACHE_TTL_MS;
};

const persistVocabularyCache = async (
  courseId: CourseType,
  dayNumber: number,
  cards: VocabularyCard[],
  updatedAt: number,
) => {
  try {
    const payload = JSON.stringify({ updatedAt, cards });
    await AsyncStorage.setItem(makeStorageKey(courseId, dayNumber), payload);
  } catch (error) {
    console.warn("Failed to persist vocabulary cache:", error);
  }
};

export const hydrateVocabularyCache = async (
  courseId: CourseType,
  dayNumber: number,
  options?: { allowStale?: boolean },
) => {
  try {
    const raw = await AsyncStorage.getItem(makeStorageKey(courseId, dayNumber));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      updatedAt?: number;
      cards?: VocabularyCard[];
    };

    if (!parsed?.cards || !Array.isArray(parsed.cards)) return null;
    if (typeof parsed.updatedAt !== "number") return null;

    const isFresh = Date.now() - parsed.updatedAt < CACHE_TTL_MS;
    if (!isFresh && options?.allowStale === false) {
      return null;
    }

    setCachedVocabularyCards(
      courseId,
      dayNumber,
      parsed.cards,
      parsed.updatedAt,
    );
    return parsed.cards;
  } catch (error) {
    console.warn("Failed to hydrate vocabulary cache:", error);
    return null;
  }
};

export const fetchVocabularyCards = async (
  courseId: CourseType,
  dayNumber: number,
) => {
  const config = getCourseConfig(courseId);

  if (!config.path) {
    console.error("No path configuration for course:", courseId);
    return [];
  }

  const subCollectionName = `Day${dayNumber}`;
  const targetCollection = collection(db, config.path, subCollectionName);
  const querySnapshot = await getDocs(query(targetCollection));

  const cards: VocabularyCard[] = querySnapshot.docs.map((doc) => {
    const data = doc.data();

    if (courseId === "COLLOCATION") {
      return {
        id: doc.id,
        word: data.collocation,
        meaning: data.meaning,
        translation: data.translation,
        pronunciation: data.explanation,
        example: data.example,
        image: data.image,
        course: courseId,
      };
    }

    return {
      id: doc.id,
      word: data.word,
      meaning: data.meaning,
      translation: data.translation,
      pronunciation: data.pronunciation,
      example: data.example,
      image: data.image,
      course: courseId,
    };
  });

  console.log(`Fetched ${cards.length} words from ${subCollectionName}`);
  const updatedAt = Date.now();
  setCachedVocabularyCards(courseId, dayNumber, cards, updatedAt);
  void persistVocabularyCache(courseId, dayNumber, cards, updatedAt);

  return cards;
};

export const prefetchVocabularyCards = async (
  courseId: CourseType,
  dayNumber: number,
) => {
  const cached = getCachedVocabularyCards(courseId, dayNumber);
  if (cached && cached.length > 0) {
    return cached;
  }
  const hydrated = await hydrateVocabularyCache(courseId, dayNumber, {
    allowStale: true,
  });
  if (hydrated && hydrated.length > 0) {
    return hydrated;
  }
  return fetchVocabularyCards(courseId, dayNumber);
};

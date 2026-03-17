import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  CourseType,
  VocabularyCard,
  isJlptLevelCourseId,
} from "../types/vocabulary";
import { normalizeVocabularyLocalizationMap } from "../utils/localizedVocabulary";

type CourseConfig = {
  path?: string;
  prefix?: string;
};

const STORAGE_PREFIX = "vocab_cache_v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

const vocabularyCache = new Map<string, VocabularyCard[]>();
const vocabularyCacheUpdatedAt = new Map<string, number>();

/**
 * Get course configuration including Firestore path and prefix
 * @param courseId - The course type ID
 * @returns Course configuration object with path and prefix
 */
export const getCourseConfig = (courseId: CourseType): CourseConfig => {
  if (isJlptLevelCourseId(courseId)) {
    return {
      path: process.env[`EXPO_PUBLIC_COURSE_PATH_${courseId}`],
      prefix: courseId,
    };
  }

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
    case "TOEFL_IELTS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL_IELTS,
        prefix: "TOEFL_IELTS",
      };
    case "COLLOCATION":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION,
        prefix: "COLLOCATION",
      };
    case "JLPT":
      return {
        path: "",
        prefix: "JLPT",
      };
    default:
      return { path: "", prefix: "" };
  }
};

const makeCacheKey = (courseId: CourseType, dayNumber: number) =>
  `${courseId}-Day${dayNumber}`;

const makeStorageKey = (courseId: CourseType, dayNumber: number) =>
  `${STORAGE_PREFIX}:${makeCacheKey(courseId, dayNumber)}`;

export const normalizeVocabularyImageUrl = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeVocabularyCard = (
  card: VocabularyCard & { image?: unknown },
): VocabularyCard => {
  const { image: legacyImage, ...rest } = card;
  const imageUrl =
    normalizeVocabularyImageUrl(rest.imageUrl) ??
    normalizeVocabularyImageUrl(legacyImage);

  return {
    ...rest,
    imageUrl,
    pronunciationRoman:
      typeof rest.pronunciationRoman === "string"
        ? rest.pronunciationRoman.trim() || undefined
        : undefined,
    localized: normalizeVocabularyLocalizationMap(rest.localized),
  };
};

export const mapVocabularyDocToCard = (
  docId: string,
  data: Record<string, unknown>,
  courseId: CourseType,
): VocabularyCard => {
  const imageUrl =
    normalizeVocabularyImageUrl(data.imageUrl) ??
    normalizeVocabularyImageUrl(data.image);

  if (isJlptLevelCourseId(courseId)) {
    return {
      id: docId,
      word: typeof data.word === "string" ? data.word : "",
      meaning: typeof data.meaningEnglish === "string" ? data.meaningEnglish : "",
      pronunciation: typeof data.pronunciation === "string" ? data.pronunciation : undefined,
      pronunciationRoman: typeof data.pronunciationRoman === "string" ? data.pronunciationRoman : undefined,
      example: typeof data.example === "string" ? data.example : "",
      imageUrl,
      localized: {
        en: {
          meaning: typeof data.meaningEnglish === "string" ? data.meaningEnglish : undefined,
          translation: typeof data.translationEnglish === "string" ? data.translationEnglish : undefined,
        },
        ko: {
          meaning: typeof data.meaningKorean === "string" ? data.meaningKorean : undefined,
          translation: typeof data.translationKorean === "string" ? data.translationKorean : undefined,
        },
      },
      course: courseId,
    };
  }

  if (courseId === "COLLOCATION") {
    return {
      id: docId,
      word: typeof data.collocation === "string" ? data.collocation : "",
      meaning: typeof data.meaning === "string" ? data.meaning : "",
      translation:
        typeof data.translation === "string" ? data.translation : undefined,
      pronunciation:
        typeof data.explanation === "string" ? data.explanation : undefined,
      pronunciationRoman:
        typeof data.pronunciationRoman === "string"
          ? data.pronunciationRoman
          : undefined,
      example: typeof data.example === "string" ? data.example : "",
      imageUrl,
      localized: normalizeVocabularyLocalizationMap(data.localized),
      course: courseId,
    };
  }

  return {
    id: docId,
    word: typeof data.word === "string" ? data.word : "",
    meaning: typeof data.meaning === "string" ? data.meaning : "",
    translation:
      typeof data.translation === "string" ? data.translation : undefined,
    pronunciation:
      typeof data.pronunciation === "string"
        ? data.pronunciation
        : undefined,
    pronunciationRoman:
      typeof data.pronunciationRoman === "string"
        ? data.pronunciationRoman
        : undefined,
    example: typeof data.example === "string" ? data.example : "",
    imageUrl,
    localized: normalizeVocabularyLocalizationMap(data.localized),
    course: courseId,
    partOfSpeech: data.partOfSpeech as VocabularyCard["partOfSpeech"],
    synonyms: Array.isArray(data.synonyms)
      ? (data.synonyms as string[])
      : [],
    antonyms: Array.isArray(data.antonyms)
      ? (data.antonyms as string[])
      : [],
    relatedWords: Array.isArray(data.relatedWords)
      ? (data.relatedWords as string[])
      : [],
    wordForms: data.wordForms as VocabularyCard["wordForms"],
  };
};

const setCachedVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
  cards: VocabularyCard[],
  updatedAt = Date.now(),
) => {
  const key = makeCacheKey(courseId, dayNumber);
  const normalizedCards = cards.map((card) => normalizeVocabularyCard(card));
  vocabularyCache.set(key, normalizedCards);
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
    const payload = JSON.stringify({
      updatedAt,
      cards: cards.map((card) => normalizeVocabularyCard(card)),
    });
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

    const normalizedCards = parsed.cards.map((card) =>
      normalizeVocabularyCard(card as VocabularyCard & { image?: unknown }),
    );
    setCachedVocabularyCards(
      courseId,
      dayNumber,
      normalizedCards,
      parsed.updatedAt,
    );
    return normalizedCards;
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

  if (isJlptLevelCourseId(courseId)) {
    querySnapshot.docs.forEach((snapshot, index) => {
      console.log(`[JLPT] doc[${index}]:`, JSON.stringify(snapshot.data(), null, 2));
    });
  }

  const cards: VocabularyCard[] = querySnapshot.docs.map((snapshot) =>
    mapVocabularyDocToCard(
      snapshot.id,
      snapshot.data() as Record<string, unknown>,
      courseId,
    ),
  );

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

// ============================================================================
// COURSE METADATA MANAGEMENT
// ============================================================================

/**
 * Updates the course metadata with the total number of days
 * This function is called after successfully uploading a new day
 *
 * Stores metadata as fields (totalDays, lastUpdated, lastUploadedDayId) directly in the course document
 *
 * @param courseId - The course type ID (e.g., 'TOEIC', 'TOEFL')
 * @param dayNumber - The day number that was just uploaded
 * @returns Promise that resolves when metadata is updated
 *
 * @example
 * await updateCourseMetadata('TOEIC', 5); // Updates TOEIC metadata with day 5
 */
export const updateCourseMetadata = async (
  courseId: CourseType,
  dayNumber: number,
): Promise<void> => {
  const config = getCourseConfig(courseId);

  if (!config.path) {
    console.error("No path configuration for course:", courseId);
    return;
  }

  try {
    // Store metadata fields directly in the course document
    const courseDocRef = doc(db, config.path);
    const courseDoc = await getDoc(courseDocRef);
    const dayId = `Day${dayNumber}`;

    if (courseDoc.exists()) {
      const currentMaxDay = courseDoc.data().totalDays || 0;
      const updateData: {
        lastUpdated: string;
        lastUploadedDayId: string;
        totalDays?: number;
      } = {
        lastUpdated: new Date().toISOString(),
        lastUploadedDayId: dayId,
      };

      // Update totalDays only if the new day number is greater than the current max
      if (dayNumber > currentMaxDay) {
        updateData.totalDays = dayNumber;
      }

      await updateDoc(courseDocRef, updateData);
      console.log(`Updated ${courseId} metadata: lastUploadedDayId = ${dayId}${dayNumber > currentMaxDay ? `, totalDays = ${dayNumber}` : ''}`);
    } else {
      // Create document with metadata if it doesn't exist
      await setDoc(courseDocRef, {
        totalDays: dayNumber,
        lastUpdated: new Date().toISOString(),
        lastUploadedDayId: dayId,
      });
      console.log(`Created ${courseId} metadata: totalDays = ${dayNumber}, lastUploadedDayId = ${dayId}`);
    }
  } catch (error) {
    console.error(`Error updating metadata for ${courseId}:`, error);
    throw error;
  }
};

/**
 * Fetches the total number of days available for a course
 *
 * Reads the totalDays field from the course document
 *
 * @param courseId - The course type ID (e.g., 'TOEIC', 'TOEFL')
 * @returns Promise that resolves to the total number of days (0 if none found)
 *
 * @example
 * const totalDays = await getTotalDaysForCourse('TOEIC');
 * console.log(`TOEIC has ${totalDays} days`);
 */
export const getTotalDaysForCourse = async (
  courseId: CourseType,
): Promise<number> => {
  const config = getCourseConfig(courseId);

  if (!config.path) {
    console.error("No path configuration for course:", courseId);
    return 0;
  }

  try {
    // Read metadata fields from the course document
    const courseDocRef = doc(db, config.path);
    const courseDoc = await getDoc(courseDocRef);

    if (courseDoc.exists()) {
      const totalDays = courseDoc.data().totalDays || 0;
      console.log(`${courseId} has ${totalDays} days`);
      return totalDays;
    }

    console.log(`No metadata found for ${courseId}, returning 0`);
    return 0;
  } catch (error) {
    console.error(`Error fetching metadata for ${courseId}:`, error);
    return 0;
  }
};

/**
 * Gets the complete metadata for a course including total days and last update time
 *
 * Reads the totalDays, lastUpdated, and lastUploadedDayId fields from the course document
 *
 * @param courseId - The course type ID
 * @returns Promise that resolves to metadata object or null if not found
 */
export const getCourseMetadata = async (
  courseId: CourseType,
): Promise<{
  totalDays: number;
  lastUpdated: string;
  lastUploadedDayId: string;
} | null> => {
  const config = getCourseConfig(courseId);

  if (!config.path) {
    console.error("No path configuration for course:", courseId);
    return null;
  }

  try {
    // Read metadata fields from the course document
    const courseDocRef = doc(db, config.path);
    const courseDoc = await getDoc(courseDocRef);

    if (courseDoc.exists()) {
      const data = courseDoc.data();
      return {
        totalDays: data.totalDays || 0,
        lastUpdated: data.lastUpdated || "",
        lastUploadedDayId: data.lastUploadedDayId || "",
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching metadata for ${courseId}:`, error);
    return null;
  }
};

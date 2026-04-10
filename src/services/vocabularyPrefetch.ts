import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseError } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useNetworkStore } from "../stores/networkStore";
import {
  CourseType,
  VocabularyCard,
  isJlptLevelCourseId,
} from "../types/vocabulary";
import { normalizeVocabularyLocalizationMap } from "../utils/localizedVocabulary";
import {
  normalizeLegacySynonymValue,
  normalizeSynonyms,
} from "../utils/synonyms";
import { db } from "./firebase";

type CourseConfig = {
  path?: string;
  prefix?: string;
};

// Bump the cache version so older persisted cards without newly added fields
// like `exampleRoman` or normalized legacy TOEFL synonyms do not mask fresh data.
const STORAGE_PREFIX = "vocab_cache_v4";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const METADATA_TTL_MS = 1000 * 60 * 10;

const vocabularyCache = new Map<string, VocabularyCard[]>();
const vocabularyCacheUpdatedAt = new Map<string, number>();
const inFlightVocabularyFetches = new Map<string, Promise<VocabularyCard[]>>();
const totalDaysCache = new Map<CourseType, { totalDays: number; updatedAt: number }>();
const inFlightTotalDaysRequests = new Map<CourseType, Promise<number>>();

type PrefetchVocabularyOptions = {
  allowStale?: boolean;
  revalidateIfStale?: boolean;
  preferCache?: boolean;
};

type FirestoreVocabularyFetchOptions = {
  limitCount?: number;
};

/**
 * Get course configuration including Firestore path and prefix
 * @param courseId - The course type ID
 * @returns Course configuration object with path and prefix
 */
export const getCourseConfig = (courseId: CourseType): CourseConfig => {
  if (isJlptLevelCourseId(courseId)) {
    const jlptPaths: Record<string, string | undefined> = {
      JLPT_N1: process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N1,
      JLPT_N2: process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N2,
      JLPT_N3: process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N3,
      JLPT_N4: process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N4,
      JLPT_N5: process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N5,
    };
    return {
      path: jlptPaths[courseId],
      prefix: courseId,
    };
  }

  switch (courseId) {
    case "수능":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT,
        prefix: "CSAT",
      };
    case "CSAT_IDIOMS":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT_IDIOMS,
        prefix: "CSAT_IDIOMS",
      };
    case "TOEIC":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC,
        prefix: "TOEIC",
      };
    case "TOEFL_IELTS":
      return {
        path:
          process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL_IELTS ??
          process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL ??
          process.env.EXPO_PUBLIC_COURSE_PATH_IELTS,
        prefix: "TOEFL_IELTS",
      };
    case "EXTREMELY_ADVANCED":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_EXTREMELY_ADVANCED,
        prefix: "EXTREMELY_ADVANCED",
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

const isCacheEntryFresh = (updatedAt?: number) =>
  typeof updatedAt === "number" && Date.now() - updatedAt < CACHE_TTL_MS;

const isMetadataEntryFresh = (updatedAt?: number) =>
  typeof updatedAt === "number" && Date.now() - updatedAt < METADATA_TTL_MS;

const markFirebaseReadSuccess = () => {
  useNetworkStore.getState().setFirebaseOnline();
};

const markFirebaseReadFailure = (error: unknown) => {
  if (error instanceof FirebaseError) {
    useNetworkStore.getState().setFirebaseOffline(true);
  }
};

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
    exampleRoman:
      typeof rest.exampleRoman === "string"
        ? rest.exampleRoman.trim() || undefined
        : undefined,
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
  const normalizedSynonyms = Array.isArray(data.synonyms)
    ? normalizeSynonyms(data.synonyms as string[])
    : typeof data.synonym === "string"
      ? normalizeLegacySynonymValue(data.synonym)
      : [];
  const imageUrl =
    normalizeVocabularyImageUrl(data.imageUrl) ??
    normalizeVocabularyImageUrl(data.image);

  if (isJlptLevelCourseId(courseId)) {
    return {
      id: docId,
      word: typeof data.word === "string" ? data.word : "",
      meaning:
        typeof data.meaningEnglish === "string" ? data.meaningEnglish : "",
      pronunciation:
        typeof data.pronunciation === "string" ? data.pronunciation : undefined,
      pronunciationRoman:
        typeof data.pronunciationRoman === "string"
          ? data.pronunciationRoman
          : undefined,
      example: typeof data.example === "string" ? data.example : "",
      exampleRoman:
        typeof data.exampleRoman === "string" ? data.exampleRoman : undefined,
      imageUrl,
      localized: {
        en: {
          meaning:
            typeof data.meaningEnglish === "string"
              ? data.meaningEnglish
              : undefined,
          translation:
            typeof data.translationEnglish === "string"
              ? data.translationEnglish
              : undefined,
        },
        ko: {
          meaning:
            typeof data.meaningKorean === "string"
              ? data.meaningKorean
              : undefined,
          translation:
            typeof data.translationKorean === "string"
              ? data.translationKorean
              : undefined,
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

  if (courseId === "CSAT_IDIOMS") {
    return {
      id: docId,
      word: typeof data.idiom === "string" ? data.idiom : "",
      meaning: typeof data.meaning === "string" ? data.meaning : "",
      translation:
        typeof data.translation === "string" ? data.translation : "",
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
      typeof data.pronunciation === "string" ? data.pronunciation : undefined,
    pronunciationRoman:
      typeof data.pronunciationRoman === "string"
        ? data.pronunciationRoman
        : undefined,
    example: typeof data.example === "string" ? data.example : "",
    imageUrl,
    localized: normalizeVocabularyLocalizationMap(data.localized),
    course: courseId,
    partOfSpeech: data.partOfSpeech as VocabularyCard["partOfSpeech"],
    synonyms: normalizedSynonyms,
    antonyms: Array.isArray(data.antonyms) ? (data.antonyms as string[]) : [],
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
  return isCacheEntryFresh(updatedAt);
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

    const isFresh = isCacheEntryFresh(parsed.updatedAt);
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

export const fetchVocabularyCardsFromFirestore = async (
  courseId: CourseType,
  dayNumber: number,
  options?: FirestoreVocabularyFetchOptions,
) => {
  const config = getCourseConfig(courseId);

  if (!config.path) {
    console.error("No path configuration for course:", courseId);
    return [];
  }

  try {
    const subCollectionName = `Day${dayNumber}`;
    const targetCollection = collection(db, config.path, subCollectionName);
    const querySnapshot = await getDocs(
      query(
        targetCollection,
        ...(options?.limitCount ? [limit(options.limitCount)] : []),
      ),
    );
    const cards: VocabularyCard[] = querySnapshot.docs.map((snapshot) =>
      mapVocabularyDocToCard(
        snapshot.id,
        snapshot.data() as Record<string, unknown>,
        courseId,
      ),
    );
    markFirebaseReadSuccess();
    return cards;
  } catch (error) {
    markFirebaseReadFailure(error);
    throw error;
  }
};

export const fetchVocabularyCards = async (
  courseId: CourseType,
  dayNumber: number,
) => {
  const cacheKey = makeCacheKey(courseId, dayNumber);
  const existingRequest = inFlightVocabularyFetches.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const cards = await fetchVocabularyCardsFromFirestore(courseId, dayNumber);
      console.log(`Fetched ${cards.length} words from Day${dayNumber}`);
      const updatedAt = Date.now();
      setCachedVocabularyCards(courseId, dayNumber, cards, updatedAt);
      void persistVocabularyCache(courseId, dayNumber, cards, updatedAt);
      return cards;
    } catch (error) {
      markFirebaseReadFailure(error);
      throw error;
    }
  })();

  inFlightVocabularyFetches.set(cacheKey, request);
  return request.finally(() => {
    inFlightVocabularyFetches.delete(cacheKey);
  });
};

const revalidateVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
) => {
  void fetchVocabularyCards(courseId, dayNumber).catch((error) => {
    console.warn("Vocabulary revalidation failed:", error);
  });
};

export const prefetchVocabularyCards = async (
  courseId: CourseType,
  dayNumber: number,
  options?: PrefetchVocabularyOptions,
) => {
  const allowStale = options?.allowStale ?? true;
  const preferCache = options?.preferCache ?? true;
  const revalidateIfStale = options?.revalidateIfStale ?? true;

  if (preferCache) {
    const cached = getCachedVocabularyCards(courseId, dayNumber);
    if (cached && cached.length > 0) {
      const fresh = isVocabularyCacheFresh(courseId, dayNumber);
      if (fresh) {
        return cached;
      }
      if (allowStale) {
        if (revalidateIfStale) {
          revalidateVocabularyCards(courseId, dayNumber);
        }
        return cached;
      }
    }

    const hydrated = await hydrateVocabularyCache(courseId, dayNumber, {
      allowStale,
    });
    if (hydrated && hydrated.length > 0) {
      const fresh = isVocabularyCacheFresh(courseId, dayNumber);
      if (fresh) {
        return hydrated;
      }
      if (allowStale) {
        if (revalidateIfStale) {
          revalidateVocabularyCards(courseId, dayNumber);
        }
        return hydrated;
      }
    }
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
      totalDaysCache.set(courseId, {
        totalDays: updateData.totalDays ?? currentMaxDay,
        updatedAt: Date.now(),
      });
      console.log(
        `Updated ${courseId} metadata: lastUploadedDayId = ${dayId}${dayNumber > currentMaxDay ? `, totalDays = ${dayNumber}` : ""}`,
      );
    } else {
      // Create document with metadata if it doesn't exist
      await setDoc(courseDocRef, {
        totalDays: dayNumber,
        lastUpdated: new Date().toISOString(),
        lastUploadedDayId: dayId,
      });
      totalDaysCache.set(courseId, {
        totalDays: dayNumber,
        updatedAt: Date.now(),
      });
      console.log(
        `Created ${courseId} metadata: totalDays = ${dayNumber}, lastUploadedDayId = ${dayId}`,
      );
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

  const cached = totalDaysCache.get(courseId);
  if (cached && isMetadataEntryFresh(cached.updatedAt)) {
    return cached.totalDays;
  }

  const existingRequest = inFlightTotalDaysRequests.get(courseId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      // Read metadata fields from the course document
      const courseDocRef = doc(db, config.path);
      const courseDoc = await getDoc(courseDocRef);

      markFirebaseReadSuccess();

      const totalDays =
        courseDoc.exists() ? (courseDoc.data().totalDays || 0) : 0;
      totalDaysCache.set(courseId, { totalDays, updatedAt: Date.now() });

      if (courseDoc.exists()) {
        console.log(`${courseId} has ${totalDays} days`);
      } else {
        console.log(`No metadata found for ${courseId}, returning 0`);
      }

      return totalDays;
    } catch (error) {
      markFirebaseReadFailure(error);
      console.error(`Error fetching metadata for ${courseId}:`, error);
      return 0;
    }
  })();

  inFlightTotalDaysRequests.set(courseId, request);
  return request.finally(() => {
    inFlightTotalDaysRequests.delete(courseId);
  });
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

    markFirebaseReadSuccess();

    if (courseDoc.exists()) {
      const data = courseDoc.data();
      totalDaysCache.set(courseId, {
        totalDays: data.totalDays || 0,
        updatedAt: Date.now(),
      });
      return {
        totalDays: data.totalDays || 0,
        lastUpdated: data.lastUpdated || "",
        lastUploadedDayId: data.lastUploadedDayId || "",
      };
    }

    return null;
  } catch (error) {
    markFirebaseReadFailure(error);
    console.error(`Error fetching metadata for ${courseId}:`, error);
    return null;
  }
};

export const __resetVocabularyPrefetchStateForTests = () => {
  vocabularyCache.clear();
  vocabularyCacheUpdatedAt.clear();
  inFlightVocabularyFetches.clear();
  totalDaysCache.clear();
  inFlightTotalDaysRequests.clear();
};

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
  CourseVocabularyCard,
  CourseType,
  KanjiNestedListGroup,
  KanjiWord,
  VocabularyCard,
  isJlptLevelCourseId,
  isKanjiWord,
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
// or course-specific shapes do not mask fresh Firestore data.
const STORAGE_PREFIX = "vocab_cache_v6";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const METADATA_TTL_MS = 1000 * 60 * 10;
const VOCAB_CACHE_MAX_ENTRIES = 50;

const vocabularyCache = new Map<string, CourseVocabularyCard[]>();
const vocabularyCacheUpdatedAt = new Map<string, number>();
const inFlightVocabularyFetches = new Map<
  string,
  Promise<CourseVocabularyCard[]>
>();
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

type NonKanjiCourseType = Exclude<CourseType, "KANJI">;

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
    case "KANJI":
      return {
        path: process.env.EXPO_PUBLIC_COURSE_PATH_KANJI,
        prefix: "KANJI",
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

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const normalizeKanjiNestedListGroups = (
  value: unknown,
): KanjiNestedListGroup[] =>
  Array.isArray(value)
    ? value.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? {
              items: normalizeStringArray(
                (item as Record<string, unknown>).items,
              ),
            }
          : { items: [] },
      )
    : [];

const mapKanjiDocToWord = (
  docId: string,
  data: Record<string, unknown>,
): KanjiWord => ({
  id: docId,
  kanji:
    typeof data.Kanji === "string"
      ? data.Kanji
      : typeof data.kanji === "string"
        ? data.kanji
        : "",
  meaning: normalizeStringArray(data.meaning),
  meaningKorean: normalizeStringArray(data.meaningKorean),
  meaningKoreanRomanize: normalizeStringArray(data.meaningKoreanRomanize),
  meaningExample: normalizeKanjiNestedListGroups(data.meaningExample),
  meaningExampleHurigana: normalizeKanjiNestedListGroups(
    data.meaningExampleHurigana,
  ),
  meaningEnglishTranslation: normalizeKanjiNestedListGroups(
    data.meaningEnglishTranslation,
  ),
  meaningKoreanTranslation: normalizeKanjiNestedListGroups(
    data.meaningKoreanTranslation,
  ),
  reading: normalizeStringArray(data.reading),
  readingKorean: normalizeStringArray(data.readingKorean),
  readingKoreanRomanize: normalizeStringArray(data.readingKoreanRomanize),
  readingExample: normalizeKanjiNestedListGroups(data.readingExample),
  readingExampleHurigana: normalizeKanjiNestedListGroups(
    data.readingExampleHurigana,
  ),
  readingEnglishTranslation: normalizeKanjiNestedListGroups(
    data.readingEnglishTranslation,
  ),
  readingKoreanTranslation: normalizeKanjiNestedListGroups(
    data.readingKoreanTranslation,
  ),
  example: normalizeStringArray(data.example),
  exampleEnglishTranslation: normalizeStringArray(data.exampleEnglishTranslation),
  exampleKoreanTranslation: normalizeStringArray(data.exampleKoreanTranslation),
  exampleHurigana: normalizeStringArray(data.exampleHurigana),
});

const KANJI_FIRESTORE_LOG_FIELDS = [
  "Kanji",
  "kanji",
  "meaning",
  "meaningKorean",
  "meaningKoreanRomanize",
  "meaningExample",
  "meaningExampleHurigana",
  "meaningEnglishTranslation",
  "meaningKoreanTranslation",
  "reading",
  "readingKorean",
  "readingKoreanRomanize",
  "readingExample",
  "readingExampleHurigana",
  "readingEnglishTranslation",
  "readingKoreanTranslation",
  "example",
  "exampleEnglishTranslation",
  "exampleKoreanTranslation",
  "exampleHurigana",
] as const;

const formatKanjiFirestoreValue = (
  value: unknown,
  indentLevel = 0,
): string[] => {
  const indent = "  ".repeat(indentLevel);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${indent}[]`];
    }

    return value.flatMap((item, index) => {
      if (item && typeof item === "object") {
        return [
          `${indent}${index}`,
          ...formatKanjiFirestoreValue(item, indentLevel + 1),
        ];
      }

      return [`${indent}${index} ${JSON.stringify(item)}`];
    });
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return [`${indent}{}`];
    }

    return entries.flatMap(([key, nestedValue]) => [
      `${indent}${key}`,
      ...formatKanjiFirestoreValue(nestedValue, indentLevel + 1),
    ]);
  }

  return [`${indent}${JSON.stringify(value)}`];
};

export const formatKanjiFirestoreDocumentForLog = (
  data: Record<string, unknown>,
) =>
  KANJI_FIRESTORE_LOG_FIELDS.flatMap((key) => [
    key,
    ...formatKanjiFirestoreValue(data[key], 1),
  ]);

const logKanjiFirestoreDocument = ({
  path,
  day,
  id,
  data,
}: {
  path: string;
  day: string;
  id: string;
  data: Record<string, unknown>;
}) => {
  console.log(
    [
      `[KANJI Firestore] ${path}/${day}/${id}`,
      ...formatKanjiFirestoreDocumentForLog(data),
    ].join("\n"),
  );
};

export function normalizeVocabularyCard(
  card: KanjiWord & { image?: unknown },
): KanjiWord;
export function normalizeVocabularyCard(
  card: VocabularyCard & { image?: unknown },
): VocabularyCard;
export function normalizeVocabularyCard(
  card: CourseVocabularyCard & { image?: unknown },
): CourseVocabularyCard;
export function normalizeVocabularyCard(
  card: CourseVocabularyCard & { image?: unknown },
): CourseVocabularyCard {
  if (isKanjiWord(card)) {
    return card;
  }

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
    exampleFurigana:
      typeof rest.exampleFurigana === "string"
        ? rest.exampleFurigana.trim() || undefined
        : undefined,
    exampleHurigana:
      typeof rest.exampleHurigana === "string"
        ? rest.exampleHurigana.trim() || undefined
        : undefined,
    pronunciationRoman:
      typeof rest.pronunciationRoman === "string"
        ? rest.pronunciationRoman.trim() || undefined
        : undefined,
    localized: normalizeVocabularyLocalizationMap(rest.localized),
  };
}

export function mapVocabularyDocToCard(
  docId: string,
  data: Record<string, unknown>,
  courseId: "KANJI",
): KanjiWord;
export function mapVocabularyDocToCard(
  docId: string,
  data: Record<string, unknown>,
  courseId: NonKanjiCourseType,
): VocabularyCard;
export function mapVocabularyDocToCard(
  docId: string,
  data: Record<string, unknown>,
  courseId: CourseType,
): CourseVocabularyCard;
export function mapVocabularyDocToCard(
  docId: string,
  data: Record<string, unknown>,
  courseId: CourseType,
): CourseVocabularyCard {
  if (courseId === "KANJI") {
    return mapKanjiDocToWord(docId, data);
  }

  const normalizedSynonyms = Array.isArray(data.synonyms)
    ? normalizeSynonyms(data.synonyms as string[])
    : typeof data.synonym === "string"
      ? normalizeLegacySynonymValue(data.synonym)
      : [];
  const imageUrl =
    normalizeVocabularyImageUrl(data.imageUrl) ??
    normalizeVocabularyImageUrl(data.image);
  const exampleFurigana =
    typeof data.exampleFurigana === "string"
      ? data.exampleFurigana
      : typeof data.exampleHurigana === "string"
        ? data.exampleHurigana
      : undefined;

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
      exampleFurigana,
      exampleHurigana: exampleFurigana,
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
      exampleFurigana,
      exampleHurigana: exampleFurigana,
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
      exampleFurigana,
      exampleHurigana: exampleFurigana,
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
    exampleFurigana,
    exampleHurigana: exampleFurigana,
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
}

const setCachedVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
  cards: CourseVocabularyCard[],
  updatedAt = Date.now(),
) => {
  const key = makeCacheKey(courseId, dayNumber);
  const normalizedCards = cards.map((card) => normalizeVocabularyCard(card));
  vocabularyCache.set(key, normalizedCards);
  vocabularyCacheUpdatedAt.set(key, updatedAt);
};

export function getCachedVocabularyCards(
  courseId: "KANJI",
  dayNumber: number,
): KanjiWord[] | undefined;
export function getCachedVocabularyCards(
  courseId: NonKanjiCourseType,
  dayNumber: number,
): VocabularyCard[] | undefined;
export function getCachedVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
): CourseVocabularyCard[] | undefined;
export function getCachedVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
) {
  return vocabularyCache.get(makeCacheKey(courseId, dayNumber));
}

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

/**
 * Removes expired and over-limit vocabulary cache entries from AsyncStorage.
 * Call at app startup or when a write fails due to storage pressure.
 */
export const pruneVocabularyCaches = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const vocabKeys = allKeys.filter((k) => k.startsWith(`${STORAGE_PREFIX}:`));
    if (vocabKeys.length === 0) return;

    const pairs = await AsyncStorage.multiGet(vocabKeys);
    const now = Date.now();

    const entries = pairs.map(([key, raw]) => {
      try {
        const parsed = JSON.parse(raw ?? "{}") as { updatedAt?: number };
        return { key, updatedAt: parsed.updatedAt ?? 0 };
      } catch {
        return { key, updatedAt: 0 };
      }
    });

    // Sort oldest first so the slice below keeps the newest VOCAB_CACHE_MAX_ENTRIES
    entries.sort((a, b) => a.updatedAt - b.updatedAt);

    const keysToRemove = entries
      .filter(
        (e, i) =>
          now - e.updatedAt >= CACHE_TTL_MS ||
          i < entries.length - VOCAB_CACHE_MAX_ENTRIES,
      )
      .map((e) => e.key);

    if (keysToRemove.length === 0) return;

    await AsyncStorage.multiRemove(keysToRemove);
    console.log(`Pruned ${keysToRemove.length} vocabulary cache entries`);
  } catch (error) {
    console.warn("Failed to prune vocabulary caches:", error);
  }
};

const persistVocabularyCache = async (
  courseId: CourseType,
  dayNumber: number,
  cards: CourseVocabularyCard[],
  updatedAt: number,
) => {
  const buildPayload = () =>
    JSON.stringify({
      updatedAt,
      cards: cards.map((card) => normalizeVocabularyCard(card)),
    });

  try {
    await AsyncStorage.setItem(makeStorageKey(courseId, dayNumber), buildPayload());
  } catch (error) {
    console.warn("Failed to persist vocabulary cache, freeing space and retrying:", error);
    try {
      await pruneVocabularyCaches();
      await AsyncStorage.setItem(makeStorageKey(courseId, dayNumber), buildPayload());
    } catch (retryError) {
      console.warn("Failed to persist vocabulary cache after pruning:", retryError);
    }
  }
};

export function hydrateVocabularyCache(
  courseId: "KANJI",
  dayNumber: number,
  options?: { allowStale?: boolean },
): Promise<KanjiWord[] | null>;
export function hydrateVocabularyCache(
  courseId: NonKanjiCourseType,
  dayNumber: number,
  options?: { allowStale?: boolean },
): Promise<VocabularyCard[] | null>;
export function hydrateVocabularyCache(
  courseId: CourseType,
  dayNumber: number,
  options?: { allowStale?: boolean },
): Promise<CourseVocabularyCard[] | null>;
export async function hydrateVocabularyCache(
  courseId: CourseType,
  dayNumber: number,
  options?: { allowStale?: boolean },
) {
  try {
    const raw = await AsyncStorage.getItem(makeStorageKey(courseId, dayNumber));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      updatedAt?: number;
      cards?: CourseVocabularyCard[];
    };

    if (!parsed?.cards || !Array.isArray(parsed.cards)) return null;
    if (typeof parsed.updatedAt !== "number") return null;

    const isFresh = isCacheEntryFresh(parsed.updatedAt);
    if (!isFresh && options?.allowStale === false) {
      return null;
    }

    const normalizedCards = parsed.cards.map((card) =>
      normalizeVocabularyCard(card as CourseVocabularyCard & { image?: unknown }),
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
}

export function fetchVocabularyCardsFromFirestore(
  courseId: "KANJI",
  dayNumber: number,
  options?: FirestoreVocabularyFetchOptions,
): Promise<KanjiWord[]>;
export function fetchVocabularyCardsFromFirestore(
  courseId: NonKanjiCourseType,
  dayNumber: number,
  options?: FirestoreVocabularyFetchOptions,
): Promise<VocabularyCard[]>;
export function fetchVocabularyCardsFromFirestore(
  courseId: CourseType,
  dayNumber: number,
  options?: FirestoreVocabularyFetchOptions,
): Promise<CourseVocabularyCard[]>;
export async function fetchVocabularyCardsFromFirestore(
  courseId: CourseType,
  dayNumber: number,
  options?: FirestoreVocabularyFetchOptions,
) {
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
    const cards: CourseVocabularyCard[] = querySnapshot.docs.map((snapshot) => {
      const data = snapshot.data() as Record<string, unknown>;
      const card = mapVocabularyDocToCard(snapshot.id, data, courseId);

      if (courseId === "KANJI") {
        logKanjiFirestoreDocument({
          path: config.path ?? "",
          day: subCollectionName,
          id: snapshot.id,
          data,
        });
      }

      return card;
    });
    markFirebaseReadSuccess();
    return cards;
  } catch (error) {
    markFirebaseReadFailure(error);
    throw error;
  }
}

export function fetchVocabularyCards(
  courseId: "KANJI",
  dayNumber: number,
): Promise<KanjiWord[]>;
export function fetchVocabularyCards(
  courseId: NonKanjiCourseType,
  dayNumber: number,
): Promise<VocabularyCard[]>;
export function fetchVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
): Promise<CourseVocabularyCard[]>;
export async function fetchVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
) {
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
}

const revalidateVocabularyCards = (
  courseId: CourseType,
  dayNumber: number,
) => {
  void fetchVocabularyCards(courseId, dayNumber).catch((error) => {
    console.warn("Vocabulary revalidation failed:", error);
  });
};

export function prefetchVocabularyCards(
  courseId: "KANJI",
  dayNumber: number,
  options?: PrefetchVocabularyOptions,
): Promise<KanjiWord[]>;
export function prefetchVocabularyCards(
  courseId: NonKanjiCourseType,
  dayNumber: number,
  options?: PrefetchVocabularyOptions,
): Promise<VocabularyCard[]>;
export function prefetchVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
  options?: PrefetchVocabularyOptions,
): Promise<CourseVocabularyCard[]>;
export async function prefetchVocabularyCards(
  courseId: CourseType,
  dayNumber: number,
  options?: PrefetchVocabularyOptions,
) {
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
}

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
  const coursePath = config.path;

  if (!coursePath) {
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
      const courseDocRef = doc(db, coursePath);
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import {
  CourseType,
  LearningLanguage,
  isJlptLevelCourseId,
} from "../types/vocabulary";
import { db } from "./firebase";

export type PopQuizMatchingGame = {
  quiz_type: "matching";
  language: "english" | "japanese";
  course: string;
  level?: string | null;
  day: number;
  items: {
    id: string;
    word: string;
    meaning?: string;
    meaningEnglish?: string;
    meaningKorean?: string;
  }[];
  choices: {
    id: string;
    text: string;
    meaning?: string;
    meaningEnglish?: string;
    meaningKorean?: string;
  }[];
  answer_key: {
    item_id: string;
    choice_id: string;
  }[];
};

export type PopQuizUnavailableReason =
  | "missing-course"
  | "missing-level"
  | "missing-config"
  | "invalid-config"
  | "not-found"
  | "missing-branch"
  | "missing-day"
  | "malformed";

export type FetchPopQuizResult = {
  game: PopQuizMatchingGame | null;
  reason?: PopQuizUnavailableReason;
};

type RawMatchingItem = {
  id?: unknown;
  word?: unknown;
  kanji?: unknown;
  collocation?: unknown;
  idiom?: unknown;
  text?: unknown;
  meaning?: unknown;
  meaningEnglish?: unknown;
  meaningKorean?: unknown;
};

type RawMatchingChoice = RawMatchingItem;

type RawAnswer = {
  item_id?: unknown;
  itemId?: unknown;
  choice_id?: unknown;
  choiceId?: unknown;
};

const STORAGE_PREFIX = "popQuiz:v1";

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const readNestedRecord = (
  root: Record<string, unknown> | undefined,
  keys: string[],
): Record<string, unknown> | undefined =>
  keys.reduce<Record<string, unknown> | undefined>(
    (current, key) => asRecord(current?.[key]),
    root,
  );

const getCollectionSegments = (path: string | undefined) => {
  const segments = normalizeString(path)?.split("/").filter(Boolean) ?? [];
  return segments.length > 0 && segments.length % 2 === 1 ? segments : null;
};

export const getPopQuizCollectionPath = (
  language: LearningLanguage,
): string | undefined =>
  language === "ja"
    ? process.env.EXPO_PUBLIC_POP_QUIZ_JAPANESE
    : process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH;

export const buildPopQuizDocPathSegments = (language: LearningLanguage) => {
  const path = getPopQuizCollectionPath(language);
  const collectionSegments = getCollectionSegments(path);
  return collectionSegments ? [...collectionSegments, "data"] : null;
};

export const getPopQuizStorageLevel = (
  courseId: CourseType | string | undefined,
) => {
  if (!isJlptLevelCourseId(courseId)) return null;
  return courseId.replace("JLPT_", "");
};

export const getPopQuizCacheKey = ({
  language,
  course,
  level,
  day,
}: {
  language: "english" | "japanese";
  course?: string;
  level?: string | null;
  day: number;
}) => `${STORAGE_PREFIX}:${language}:${language === "japanese" ? level : course}:Day${day}`;

const resolveItemWord = (source: RawMatchingItem): string | undefined =>
  normalizeString(source.word) ??
  normalizeString(source.kanji) ??
  normalizeString(source.collocation) ??
  normalizeString(source.idiom);

const resolveChoiceText = (
  source: RawMatchingChoice,
  language: "english" | "japanese",
  appLanguage?: string,
) => {
  const directText = normalizeString(source.text);
  if (directText) return directText;

  const directMeaning = normalizeString(source.meaning);
  if (directMeaning) return directMeaning;

  if (language === "japanese") {
    const meaningRecord = asRecord(source.meaning);
    const preferred =
      appLanguage === "ko"
        ? normalizeString(source.meaningKorean) ??
          normalizeString(meaningRecord?.meaningKorean)
        : normalizeString(source.meaningEnglish) ??
          normalizeString(meaningRecord?.meaningEnglish);
    const fallback =
      appLanguage === "ko"
        ? normalizeString(source.meaningEnglish) ??
          normalizeString(meaningRecord?.meaningEnglish)
        : normalizeString(source.meaningKorean) ??
          normalizeString(meaningRecord?.meaningKorean);

    return preferred ?? fallback;
  }

  return (
    normalizeString(source.meaningEnglish) ??
    normalizeString(source.meaningKorean)
  );
};

const normalizeAnswer = (answer: RawAnswer) => {
  const itemId = normalizeString(answer.item_id) ?? normalizeString(answer.itemId);
  const choiceId =
    normalizeString(answer.choice_id) ?? normalizeString(answer.choiceId);

  return itemId && choiceId ? { item_id: itemId, choice_id: choiceId } : null;
};

export const normalizePopQuizMatchingGame = (
  rawData: Record<string, unknown>,
  appLanguage?: string,
): PopQuizMatchingGame | null => {
  const rawItems = Array.isArray(rawData.items) ? rawData.items : null;
  const rawChoices = Array.isArray(rawData.choices) ? rawData.choices : null;
  const rawAnswerKey = Array.isArray(rawData.answer_key)
    ? rawData.answer_key
    : Array.isArray(rawData.answerKey)
      ? rawData.answerKey
      : null;
  const language =
    normalizeString(rawData.language)?.toLowerCase() === "japanese"
      ? "japanese"
      : normalizeString(rawData.language)?.toLowerCase() === "english"
        ? "english"
        : null;
  const day =
    typeof rawData.day === "number" && Number.isInteger(rawData.day)
      ? rawData.day
      : Number(rawData.day);
  const course = normalizeString(rawData.course);
  const level = normalizeString(rawData.level) ?? null;

  if (
    rawData.quiz_type !== "matching" ||
    !language ||
    !course ||
    !Number.isInteger(day) ||
    day < 1 ||
    !rawItems ||
    !rawChoices ||
    !rawAnswerKey
  ) {
    return null;
  }

  const items = rawItems
    .map<PopQuizMatchingGame["items"][number] | null>((item) => {
      const source = asRecord(item) as RawMatchingItem | undefined;
      if (!source) return null;
      const id = normalizeString(source.id);
      const word = resolveItemWord(source);
      if (!id || !word) return null;

      return {
        id,
        word,
        meaning: normalizeString(source.meaning),
        meaningEnglish: normalizeString(source.meaningEnglish),
        meaningKorean: normalizeString(source.meaningKorean),
      };
    })
    .filter((item): item is PopQuizMatchingGame["items"][number] =>
      Boolean(item),
    );

  const choices = rawChoices
    .map<PopQuizMatchingGame["choices"][number] | null>((choice) => {
      const source = asRecord(choice) as RawMatchingChoice | undefined;
      if (!source) return null;
      const id = normalizeString(source.id);
      const text = resolveChoiceText(source, language, appLanguage);
      if (!id || !text) return null;

      return {
        id,
        text,
        meaning: normalizeString(source.meaning),
        meaningEnglish: normalizeString(source.meaningEnglish),
        meaningKorean: normalizeString(source.meaningKorean),
      };
    })
    .filter((choice): choice is PopQuizMatchingGame["choices"][number] =>
      Boolean(choice),
    );

  const answer_key = rawAnswerKey
    .map((answer) =>
      asRecord(answer) ? normalizeAnswer(asRecord(answer) as RawAnswer) : null,
    )
    .filter((answer): answer is PopQuizMatchingGame["answer_key"][number] =>
      Boolean(answer),
    );

  const itemIds = new Set(items.map((item) => item.id));
  const choiceIds = new Set(choices.map((choice) => choice.id));
  const answerItemIds = new Set(answer_key.map((answer) => answer.item_id));

  if (
    items.length === 0 ||
    choices.length === 0 ||
    answer_key.length === 0 ||
    !items.every((item) => answerItemIds.has(item.id)) ||
    !answer_key.every(
      (answer) => itemIds.has(answer.item_id) && choiceIds.has(answer.choice_id),
    )
  ) {
    return null;
  }

  return {
    quiz_type: "matching",
    language,
    course,
    level,
    day,
    items,
    choices,
    answer_key,
  };
};

export const getPopQuizNestedDayData = ({
  root,
  language,
  course,
  level,
  day,
}: {
  root: Record<string, unknown>;
  language: LearningLanguage;
  course: CourseType;
  level?: string | null;
  day: number;
}): { data: Record<string, unknown> | null; reason?: PopQuizUnavailableReason } => {
  const dayKey = String(day);

  if (language === "ja") {
    if (!level) return { data: null, reason: "missing-level" };
    const levelBranch = readNestedRecord(root, ["levels", level]);
    if (!levelBranch) return { data: null, reason: "missing-branch" };
    const dayData = readNestedRecord(levelBranch, ["days", dayKey]);
    return dayData
      ? { data: dayData }
      : { data: null, reason: "missing-day" };
  }

  const courseBranch = readNestedRecord(root, ["courses", course]);
  if (!courseBranch) return { data: null, reason: "missing-branch" };
  const dayData = readNestedRecord(courseBranch, ["days", dayKey]);
  return dayData ? { data: dayData } : { data: null, reason: "missing-day" };
};

const readCachedGame = async (cacheKey: string, appLanguage?: string) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const cachedRecord = asRecord(parsed);
    if (!cachedRecord) return null;

    if (
      normalizeString(cachedRecord.language)?.toLowerCase() === "japanese" &&
      Array.isArray(cachedRecord.choices)
    ) {
      return normalizePopQuizMatchingGame(
        {
          ...cachedRecord,
          choices: cachedRecord.choices.map((choice) => {
            const choiceRecord = asRecord(choice);
            if (
              !choiceRecord ||
              (!normalizeString(choiceRecord.meaningEnglish) &&
                !normalizeString(choiceRecord.meaningKorean))
            ) {
              return choice;
            }
            const { text: _text, ...choiceWithoutCachedText } = choiceRecord;
            return choiceWithoutCachedText;
          }),
        },
        appLanguage,
      );
    }

    return normalizePopQuizMatchingGame(cachedRecord, appLanguage);
  } catch {
    return null;
  }
};

const writeCachedGame = async (
  cacheKey: string,
  game: PopQuizMatchingGame,
) => {
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(game));
  } catch {
    // Cache failures should never block quiz play.
  }
};

export const fetchPopQuizMatchingGame = async ({
  language,
  course,
  day,
  appLanguage,
}: {
  language: LearningLanguage;
  course?: CourseType;
  day: number;
  appLanguage?: string;
}): Promise<FetchPopQuizResult> => {
  if (!course) return { game: null, reason: "missing-course" };

  const storageLanguage = language === "ja" ? "japanese" : "english";
  const storageLevel = language === "ja" ? getPopQuizStorageLevel(course) : null;
  if (language === "ja" && !storageLevel) {
    return { game: null, reason: "missing-level" };
  }

  const cacheKey = getPopQuizCacheKey({
    language: storageLanguage,
    course,
    level: storageLevel,
    day,
  });
  const cached = await readCachedGame(cacheKey, appLanguage);
  if (cached) return { game: cached };

  const configuredPath = getPopQuizCollectionPath(language);
  if (!normalizeString(configuredPath)) {
    return { game: null, reason: "missing-config" };
  }

  const pathSegments = buildPopQuizDocPathSegments(language);
  if (!pathSegments) return { game: null, reason: "invalid-config" };
  const [firstSegment, ...restSegments] = pathSegments;

  const snapshot = await getDoc(doc(db, firstSegment, ...restSegments));
  if (!snapshot.exists()) return { game: null, reason: "not-found" };

  const root = snapshot.data() as Record<string, unknown>;
  const nested = getPopQuizNestedDayData({
    root,
    language,
    course,
    level: storageLevel,
    day,
  });
  if (!nested.data) return { game: null, reason: nested.reason };

  const game = normalizePopQuizMatchingGame(nested.data, appLanguage);
  if (!game) return { game: null, reason: "malformed" };

  await writeCachedGame(cacheKey, game);
  return { game };
};

import { doc, getDoc } from "firebase/firestore";
import type { QuizTypeId } from "../course/quizModes";
import type { QuizQuestion } from "../course/quizUtils";
import { isJlptLevelCourseId, type CourseType } from "../types/vocabulary";
import { db } from "./firebase";
import { getCourseConfig } from "./vocabularyPrefetch";

const FIRESTORE_QUIZ_KIND = "matching";

type QuizTextValue =
  | string
  | {
      meaningEnglish?: unknown;
      meaningKorean?: unknown;
    };

type MatchingQuizItem = {
  id?: unknown;
  text?: QuizTextValue;
  word?: unknown;
  meaning?: QuizTextValue;
  meaningEnglish?: unknown;
  meaningKorean?: unknown;
};

type MatchingQuizChoice = {
  id?: unknown;
  text?: QuizTextValue;
  word?: unknown;
  meaning?: QuizTextValue;
  meaningEnglish?: unknown;
  meaningKorean?: unknown;
};

export type FirestoreCourseQuizData = {
  questions: QuizQuestion[];
  matchingChoices: string[];
};

const isDevRuntime = () =>
  typeof __DEV__ !== "undefined" && Boolean(__DEV__);

const logQuizDebug = (message: string, details?: Record<string, unknown>) => {
  if (!isDevRuntime()) return;
  console.log(`[CourseQuizData] ${message}`, details ?? {});
};

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveLanguageKey = (
  meaningLanguage: unknown,
  appLanguage?: string,
): "meaningEnglish" | "meaningKorean" => {
  const normalized = normalizeString(meaningLanguage)
    ?.toLowerCase()
    .replace(/[^a-z]/g, "");

  if (
    normalized === "ko" ||
    normalized === "korean" ||
    normalized === "meaningkorean"
  ) {
    return "meaningKorean";
  }

  if (
    normalized === "en" ||
    normalized === "english" ||
    normalized === "meaningenglish"
  ) {
    return "meaningEnglish";
  }

  return appLanguage === "ko" ? "meaningKorean" : "meaningEnglish";
};

export const resolveFirestoreQuizText = (
  value: unknown,
  meaningLanguage: unknown,
  appLanguage?: string,
): string | undefined => {
  const directValue = normalizeString(value);
  if (directValue) return directValue;

  if (!value || typeof value !== "object") return undefined;

  const objectValue = value as Record<string, unknown>;
  const preferredKey = resolveLanguageKey(meaningLanguage, appLanguage);
  const fallbackKey =
    preferredKey === "meaningKorean" ? "meaningEnglish" : "meaningKorean";

  return (
    normalizeString(objectValue[preferredKey]) ??
    normalizeString(objectValue[fallbackKey])
  );
};

const resolveFlexibleMatchingText = (
  source: MatchingQuizItem | MatchingQuizChoice,
  meaningLanguage: unknown,
  appLanguage?: string,
) =>
  resolveFirestoreQuizText(source.text, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(source.word, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(source.meaning, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(
    {
      meaningEnglish: source.meaningEnglish,
      meaningKorean: source.meaningKorean,
    },
    meaningLanguage,
    appLanguage,
  );

const resolveMatchingWordText = (
  source: MatchingQuizItem | MatchingQuizChoice,
  meaningLanguage: unknown,
  appLanguage?: string,
) =>
  resolveFirestoreQuizText(source.word, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(source.text, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(source.meaning, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(
    {
      meaningEnglish: source.meaningEnglish,
      meaningKorean: source.meaningKorean,
    },
    meaningLanguage,
    appLanguage,
  );

const resolveJlptMatchingMeaningText = (
  source: MatchingQuizItem | MatchingQuizChoice,
  appLanguage?: string,
): string | undefined => {
  const meaningObject =
    source.meaning && typeof source.meaning === "object"
      ? (source.meaning as Record<string, unknown>)
      : undefined;
  const textObject =
    source.text && typeof source.text === "object"
      ? (source.text as Record<string, unknown>)
      : undefined;

  return resolveFirestoreQuizText(
    {
      meaningEnglish:
        normalizeString(source.meaningEnglish) ??
        normalizeString(meaningObject?.meaningEnglish) ??
        normalizeString(textObject?.meaningEnglish),
      meaningKorean:
        normalizeString(source.meaningKorean) ??
        normalizeString(meaningObject?.meaningKorean) ??
        normalizeString(textObject?.meaningKorean),
    },
    undefined,
    appLanguage,
  );
};

const resolveMatchingChoiceText = (
  choice: MatchingQuizChoice,
  meaningLanguage: unknown,
  appLanguage: string | undefined,
  courseId?: CourseType,
) => {
  if (isJlptLevelCourseId(courseId)) {
    return (
      resolveJlptMatchingMeaningText(choice, appLanguage) ??
      resolveFlexibleMatchingText(choice, meaningLanguage, appLanguage)
    );
  }

  return (
    normalizeString(choice.meaning) ??
    resolveFlexibleMatchingText(choice, meaningLanguage, appLanguage)
  );
};

const resolveMatchingItemText = (
  item: MatchingQuizItem,
  meaningLanguage: unknown,
  appLanguage?: string,
) => resolveMatchingWordText(item, meaningLanguage, appLanguage);

const getMatchingAnswerKey = (data: Record<string, unknown>) => {
  if (Array.isArray(data.answer_key)) return data.answer_key;
  if (Array.isArray(data.answerKey)) return data.answerKey;
  return [];
};

const hasMatchingAnswerKeyArray = (data: Record<string, unknown>) =>
  Array.isArray(data.answer_key) || Array.isArray(data.answerKey);

const getAnswerItemId = (answer: Record<string, unknown>) =>
  normalizeString(answer.item_id) ?? normalizeString(answer.itemId);

const getAnswerChoiceId = (answer: Record<string, unknown>) =>
  normalizeString(answer.choice_id) ?? normalizeString(answer.choiceId);

const getFirstRecordId = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  return normalizeString((value as { id?: unknown }).id);
};

const getFirstAnswerIds = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return { firstAnswerItemId: undefined, firstAnswerChoiceId: undefined };
  }

  const answer = value as Record<string, unknown>;
  return {
    firstAnswerItemId: getAnswerItemId(answer),
    firstAnswerChoiceId: getAnswerChoiceId(answer),
  };
};

export const buildCourseQuizDocPathSegments = (
  courseId: CourseType,
  dayNumber: number,
  _quizType: QuizTypeId,
) => {
  const config = getCourseConfig(courseId);

  if (!config.path) return null;

  return [
    config.path,
    `Day${dayNumber}`,
    `Day${dayNumber}-quiz`,
    FIRESTORE_QUIZ_KIND,
    "data",
  ] as const;
};

const normalizeMatchingQuiz = (
  data: Record<string, unknown>,
  appLanguage?: string,
  courseId?: CourseType,
): FirestoreCourseQuizData | null => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const rawChoices = Array.isArray(data.choices) ? data.choices : [];
  const rawAnswerKey = getMatchingAnswerKey(data);
  const meaningLanguage = data.meaning_language;

  if (
    rawItems.length === 0 ||
    rawChoices.length === 0 ||
    rawAnswerKey.length === 0
  ) {
    return null;
  }

  const items = new Map(
    rawItems
      .map((rawItem) => {
        if (!rawItem || typeof rawItem !== "object") return null;
        const item = rawItem as MatchingQuizItem;
        const id = normalizeString(item.id);
        const text = resolveMatchingItemText(item, meaningLanguage, appLanguage);
        return id && text ? [id, { id, text }] : null;
      })
      .filter((entry): entry is [string, { id: string; text: string }] =>
        Boolean(entry),
      ),
  );

  const choices = new Map(
    rawChoices
      .map((rawChoice) => {
        if (!rawChoice || typeof rawChoice !== "object") return null;
        const choice = rawChoice as MatchingQuizChoice;
        const id = normalizeString(choice.id);
        const text = resolveMatchingChoiceText(
          choice,
          meaningLanguage,
          appLanguage,
          courseId,
        );
        return id && text ? [id, { id, text }] : null;
      })
      .filter((entry): entry is [string, { id: string; text: string }] =>
        Boolean(entry),
      ),
  );

  const answerByItemId = new Map<string, string>();
  rawAnswerKey.forEach((rawAnswer) => {
    if (!rawAnswer || typeof rawAnswer !== "object") return;
    const answer = rawAnswer as Record<string, unknown>;
    const itemId = getAnswerItemId(answer);
    const choiceId = getAnswerChoiceId(answer);
    if (itemId && choiceId) {
      answerByItemId.set(itemId, choiceId);
    }
  });

  const questions: QuizQuestion[] = rawItems
    .map<QuizQuestion | null>((rawItem) => {
      if (!rawItem || typeof rawItem !== "object") return null;
      const itemId = normalizeString((rawItem as MatchingQuizItem).id);
      if (!itemId) return null;

      const item = items.get(itemId);
      const choiceId = answerByItemId.get(itemId);
      const choice = choiceId ? choices.get(choiceId) : undefined;
      if (!item || !choiceId || !choice) return null;

      return {
        id: itemId,
        word: item.text,
        meaning: choice.text,
        matchItemId: itemId,
        matchChoiceId: choiceId,
        matchChoiceText: choice.text,
        correctAnswer: choice.text,
      } satisfies QuizQuestion;
    })
    .filter((question): question is QuizQuestion => Boolean(question));

  if (questions.length === 0) return null;

  return {
    questions,
    matchingChoices: rawChoices
      .map((rawChoice) =>
        rawChoice && typeof rawChoice === "object"
          ? resolveMatchingChoiceText(
              rawChoice as MatchingQuizChoice,
              meaningLanguage,
              appLanguage,
              courseId,
            )
          : undefined,
      )
      .filter((choice): choice is string => Boolean(choice)),
  };
};

const describeInvalidMatchingQuiz = (
  data: Record<string, unknown>,
  appLanguage?: string,
  courseId?: CourseType,
) => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const rawChoices = Array.isArray(data.choices) ? data.choices : [];
  const rawAnswerKey = getMatchingAnswerKey(data);
  const meaningLanguage = data.meaning_language;

  if (!Array.isArray(data.items)) return "items is not an array";
  if (!Array.isArray(data.choices)) return "choices is not an array";
  if (!hasMatchingAnswerKeyArray(data)) {
    return "answer_key/answerKey is not an array";
  }
  if (rawItems.length === 0) return "items is empty";
  if (rawChoices.length === 0) return "choices is empty";
  if (rawAnswerKey.length === 0) return "answer_key/answerKey is empty";

  const choices = new Map(
    rawChoices
      .map((rawChoice) => {
        if (!rawChoice || typeof rawChoice !== "object") return null;
        const choice = rawChoice as MatchingQuizChoice;
        const id = normalizeString(choice.id);
        const text = resolveMatchingChoiceText(
          choice,
          meaningLanguage,
          appLanguage,
          courseId,
        );
        return id && text ? [id, text] : null;
      })
      .filter((entry): entry is [string, string] => Boolean(entry)),
  );

  const answerByItemId = new Map<string, string>();
  rawAnswerKey.forEach((rawAnswer) => {
    if (!rawAnswer || typeof rawAnswer !== "object") return;
    const answer = rawAnswer as Record<string, unknown>;
    const itemId = getAnswerItemId(answer);
    const choiceId = getAnswerChoiceId(answer);
    if (itemId && choiceId) answerByItemId.set(itemId, choiceId);
  });

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") return "item is not an object";
    const item = rawItem as MatchingQuizItem;
    const itemId = normalizeString(item.id);
    if (!itemId) return "item.id is missing";
    if (!resolveMatchingItemText(item, meaningLanguage, appLanguage)) {
      return `item ${itemId} has no resolvable text`;
    }
    const choiceId = answerByItemId.get(itemId);
    if (!choiceId) return `answer_key missing for item ${itemId}`;
    if (!choices.has(choiceId)) {
      return `choice ${choiceId} for item ${itemId} is missing or invalid`;
    }
  }

  return "no playable matching questions after normalization";
};

export const normalizeFirestoreCourseQuiz = (
  _quizKind: typeof FIRESTORE_QUIZ_KIND,
  data: Record<string, unknown>,
  appLanguage?: string,
  courseId?: CourseType,
): FirestoreCourseQuizData | null =>
  normalizeMatchingQuiz(data, appLanguage, courseId);

export const fetchCourseQuizData = async (
  courseId: CourseType,
  dayNumber: number,
  quizType: QuizTypeId,
  appLanguage?: string,
): Promise<FirestoreCourseQuizData | null> => {
  const pathSegments = buildCourseQuizDocPathSegments(
    courseId,
    dayNumber,
    quizType,
  );

  if (!pathSegments) {
    logQuizDebug("missing path config", {
      courseId,
      dayNumber,
      quizType,
      quizKind: FIRESTORE_QUIZ_KIND,
      pathSegments,
    });
    return null;
  }

  logQuizDebug("fetch", {
    courseId,
    dayNumber,
    quizType,
    quizKind: FIRESTORE_QUIZ_KIND,
    pathSegments: [...pathSegments],
  });

  const snapshot = await getDoc(doc(db, ...pathSegments));
  const exists = snapshot.exists();
  logQuizDebug("snapshot", {
    exists,
    pathSegments: [...pathSegments],
  });

  if (!exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const rawAnswerKey = getMatchingAnswerKey(data);
  const firstAnswerIds = getFirstAnswerIds(rawAnswerKey[0]);

  logQuizDebug("matching doc shape", {
    itemsIsArray: Array.isArray(data.items),
    choicesIsArray: Array.isArray(data.choices),
    answerKeyIsArray: hasMatchingAnswerKeyArray(data),
    itemsLength: Array.isArray(data.items) ? data.items.length : undefined,
    choicesLength: Array.isArray(data.choices) ? data.choices.length : undefined,
    answerKeyLength: hasMatchingAnswerKeyArray(data)
      ? rawAnswerKey.length
      : undefined,
    firstItemId: Array.isArray(data.items)
      ? getFirstRecordId(data.items[0])
      : undefined,
    firstChoiceId: Array.isArray(data.choices)
      ? getFirstRecordId(data.choices[0])
      : undefined,
    ...firstAnswerIds,
  });

  const normalized = normalizeFirestoreCourseQuiz(
    FIRESTORE_QUIZ_KIND,
    data,
    appLanguage,
    courseId,
  );
  if (!normalized) {
    logQuizDebug("normalization failed", {
      reason: describeInvalidMatchingQuiz(data, appLanguage, courseId),
    });
    return null;
  }

  logQuizDebug("normalization succeeded", {
    questionCount: normalized.questions.length,
    matchingChoiceCount: normalized.matchingChoices.length,
  });

  return normalized;
};

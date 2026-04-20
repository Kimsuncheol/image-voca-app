import { doc, getDoc } from "firebase/firestore";
import type { QuizTypeId } from "../course/quizModes";
import type { QuizQuestion, QuizWordOption } from "../course/quizUtils";
import type { CourseType } from "../types/vocabulary";
import { db } from "./firebase";
import { getCourseConfig } from "./vocabularyPrefetch";

type FirestoreQuizKind = "matching" | "fill_in_the_blank";

type QuizTextValue =
  | string
  | {
      meaningEnglish?: unknown;
      meaningKorean?: unknown;
    };

type MatchingQuizItem = {
  id?: unknown;
  text?: QuizTextValue;
  meaningEnglish?: unknown;
  meaningKorean?: unknown;
};

type MatchingQuizChoice = {
  id?: unknown;
  text?: QuizTextValue;
};

type FillInBlankOption = {
  id?: unknown;
  text?: unknown;
};

type FillInBlankQuestion = {
  id?: unknown;
  sentence?: unknown;
  translation_english?: unknown;
  translation_korean?: unknown;
  options?: unknown;
  answer_id?: unknown;
  answer_text?: unknown;
};

export type FirestoreCourseQuizData = {
  questions: QuizQuestion[];
  matchingChoices: string[];
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

const resolveMatchingItemText = (
  item: MatchingQuizItem,
  meaningLanguage: unknown,
  appLanguage?: string,
) =>
  resolveFirestoreQuizText(item.text, meaningLanguage, appLanguage) ??
  resolveFirestoreQuizText(
    {
      meaningEnglish: item.meaningEnglish,
      meaningKorean: item.meaningKorean,
    },
    meaningLanguage,
    appLanguage,
  );

export const getFirestoreQuizKindForQuizType = (
  quizType: QuizTypeId,
): FirestoreQuizKind | null => {
  switch (quizType) {
    case "matching":
    case "collocation-matching":
      return "matching";
    case "fill-in-blank":
    case "gap-fill-sentence":
      return "fill_in_the_blank";
    default:
      return null;
  }
};

export const isFirestoreBackedQuizType = (quizType: QuizTypeId) =>
  getFirestoreQuizKindForQuizType(quizType) !== null;

export const buildCourseQuizDocPathSegments = (
  courseId: CourseType,
  dayNumber: number,
  quizType: QuizTypeId,
) => {
  const config = getCourseConfig(courseId);
  const quizKind = getFirestoreQuizKindForQuizType(quizType);

  if (!config.path || !quizKind) return null;

  return [
    config.path,
    `Day${dayNumber}`,
    `Day${dayNumber}-quiz`,
    quizKind,
    "data",
  ] as const;
};

const normalizeMatchingQuiz = (
  data: Record<string, unknown>,
  appLanguage?: string,
): FirestoreCourseQuizData | null => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const rawChoices = Array.isArray(data.choices) ? data.choices : [];
  const rawAnswerKey = Array.isArray(data.answer_key) ? data.answer_key : [];
  const meaningLanguage = data.meaning_language;

  if (rawItems.length === 0 || rawChoices.length === 0 || rawAnswerKey.length === 0) {
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
        const text = resolveFirestoreQuizText(
          choice.text,
          meaningLanguage,
          appLanguage,
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
    const itemId = normalizeString(answer.item_id);
    const choiceId = normalizeString(answer.choice_id);
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
          ? resolveFirestoreQuizText(
              (rawChoice as MatchingQuizChoice).text,
              meaningLanguage,
              appLanguage,
            )
          : undefined,
      )
      .filter((choice): choice is string => Boolean(choice)),
  };
};

const normalizeFillInBlankQuiz = (
  data: Record<string, unknown>,
  appLanguage?: string,
): FirestoreCourseQuizData | null => {
  const rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  if (rawQuestions.length === 0) return null;

  const questions: QuizQuestion[] = rawQuestions
    .map<QuizQuestion | null>((rawQuestion, index) => {
      if (!rawQuestion || typeof rawQuestion !== "object") return null;
      const question = rawQuestion as FillInBlankQuestion;
      const id = normalizeString(question.id) ?? `q${index}`;
      const sentence = normalizeString(question.sentence);
      const answerId = normalizeString(question.answer_id);
      const answerText = normalizeString(question.answer_text);
      const rawOptions = Array.isArray(question.options) ? question.options : [];

      if (!sentence || !answerId || !answerText || rawOptions.length === 0) {
        return null;
      }

      const normalizedOptions: QuizWordOption[] = rawOptions
        .map<QuizWordOption | null>((rawOption) => {
          if (!rawOption || typeof rawOption !== "object") return null;
          const option = rawOption as FillInBlankOption;
          const optionId = normalizeString(option.id);
          const optionText = normalizeString(option.text);
          if (!optionId || !optionText) return null;

          return {
            id: optionId,
            word: optionText,
            answerText: optionId === answerId ? answerText : undefined,
          };
        })
        .filter((option): option is QuizWordOption => Boolean(option));

      const hasAnswerOption = normalizedOptions.some(
        (option) => option.id === answerId,
      );
      if (!hasAnswerOption) return null;

      const translation =
        appLanguage === "ko"
          ? normalizeString(question.translation_korean) ??
            normalizeString(question.translation_english)
          : normalizeString(question.translation_english) ??
            normalizeString(question.translation_korean);

      return {
        id,
        word: answerText,
        meaning: answerText,
        options: normalizedOptions,
        correctAnswer: answerText,
        clozeSentence: sentence,
        translation,
      } satisfies QuizQuestion;
    })
    .filter((question): question is QuizQuestion => Boolean(question));

  return questions.length > 0 ? { questions, matchingChoices: [] } : null;
};

export const normalizeFirestoreCourseQuiz = (
  quizKind: FirestoreQuizKind,
  data: Record<string, unknown>,
  appLanguage?: string,
): FirestoreCourseQuizData | null =>
  quizKind === "matching"
    ? normalizeMatchingQuiz(data, appLanguage)
    : normalizeFillInBlankQuiz(data, appLanguage);

export const fetchCourseQuizData = async (
  courseId: CourseType,
  dayNumber: number,
  quizType: QuizTypeId,
  appLanguage?: string,
): Promise<FirestoreCourseQuizData | null> => {
  const quizKind = getFirestoreQuizKindForQuizType(quizType);
  const pathSegments = buildCourseQuizDocPathSegments(
    courseId,
    dayNumber,
    quizType,
  );

  if (!quizKind || !pathSegments) {
    return null;
  }

  const snapshot = await getDoc(doc(db, ...pathSegments));
  if (!snapshot.exists()) {
    return null;
  }

  return normalizeFirestoreCourseQuiz(
    quizKind,
    snapshot.data() as Record<string, unknown>,
    appLanguage,
  );
};

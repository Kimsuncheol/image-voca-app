import { CourseType } from "../types/vocabulary";

export type QuizTypeId =
  | "matching"
  | "fill-in-blank"
  | "gap-fill-sentence"
  | "collocation-matching";

export interface QuizTypeOption {
  id: QuizTypeId;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

const STANDARD_QUIZ_TYPES: QuizTypeOption[] = [
  {
    id: "matching",
    title: "Matching",
    titleKey: "quiz.types.matching.title",
    description: "Match words with meanings",
    descriptionKey: "quiz.types.matching.description",
    icon: "git-compare",
    color: "#FFE66D",
  },
  {
    id: "fill-in-blank",
    title: "Fill in the Blank",
    titleKey: "quiz.types.fillInBlank.title",
    description: "Complete the sentence",
    descriptionKey: "quiz.types.fillInBlank.description",
    icon: "create-outline",
    color: "#4ECDC4",
  },
];

const COLLOCATION_QUIZ_TYPES: QuizTypeOption[] = [
  {
    id: "gap-fill-sentence",
    title: "Gap-Fill Sentence",
    titleKey: "quiz.types.gapFillSentence.title",
    description: "Complete the collocation in a sentence",
    descriptionKey: "quiz.types.gapFillSentence.description",
    icon: "create-outline",
    color: "#4ECDC4",
  },
  {
    id: "collocation-matching",
    title: "Matching",
    titleKey: "quiz.types.collocationMatching.title",
    description: "Match collocations with meanings",
    descriptionKey: "quiz.types.collocationMatching.description",
    icon: "git-compare",
    color: "#FFE66D",
  },
];

const STANDARD_QUIZ_TYPE_IDS = new Set<QuizTypeId>(
  STANDARD_QUIZ_TYPES.map((quizType) => quizType.id),
);
const COLLOCATION_QUIZ_TYPE_IDS = new Set<QuizTypeId>(
  COLLOCATION_QUIZ_TYPES.map((quizType) => quizType.id),
);

export const getQuizTypesForCourse = (
  courseId?: CourseType,
): QuizTypeOption[] =>
  courseId === "COLLOCATION" ? COLLOCATION_QUIZ_TYPES : STANDARD_QUIZ_TYPES;

export const getLegacyFallbackQuizType = (
  courseId?: CourseType,
): QuizTypeId =>
  courseId === "COLLOCATION" ? "gap-fill-sentence" : "matching";

export const sanitizeRequestedQuizType = (
  courseId: CourseType | undefined,
  requestedQuizType?: string,
): QuizTypeId => {
  if (courseId === "COLLOCATION") {
    return COLLOCATION_QUIZ_TYPE_IDS.has(requestedQuizType as QuizTypeId)
      ? (requestedQuizType as QuizTypeId)
      : getLegacyFallbackQuizType(courseId);
  }

  return STANDARD_QUIZ_TYPE_IDS.has(requestedQuizType as QuizTypeId)
    ? (requestedQuizType as QuizTypeId)
    : getLegacyFallbackQuizType(courseId);
};

export const resolveRuntimeQuizType = (quizType: QuizTypeId) => {
  switch (quizType) {
    case "gap-fill-sentence":
      return "fill-in-blank";
    case "collocation-matching":
      return "matching";
    default:
      return quizType;
  }
};

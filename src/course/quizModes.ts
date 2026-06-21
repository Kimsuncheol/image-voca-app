import { CourseType } from "../types/vocabulary";

export type QuizTypeId = "matching";

export interface QuizTypeOption {
  id: QuizTypeId;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

const MATCHING_QUIZ_TYPE: QuizTypeOption = {
  id: "matching",
  title: "Matching",
  titleKey: "quiz.types.matching.title",
  description: "Match words with meanings",
  descriptionKey: "quiz.types.matching.description",
  icon: "git-compare",
  color: "#FFE66D",
};

export const getQuizTypesForCourse = (
  _courseId?: CourseType,
): QuizTypeOption[] => [MATCHING_QUIZ_TYPE];

export const getLegacyFallbackQuizType = (
  _courseId?: CourseType,
): QuizTypeId => "matching";

export const sanitizeRequestedQuizType = (
  _courseId: CourseType | undefined,
  _requestedQuizType?: string,
): QuizTypeId => "matching";

export const resolveRuntimeQuizType = (quizType: QuizTypeId): QuizTypeId =>
  quizType;

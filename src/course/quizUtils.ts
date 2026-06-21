export interface QuizQuestion {
  id: string;
  word: string;
  meaning: string;
  matchItemId?: string;
  matchChoiceId?: string;
  matchChoiceText?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  correctAnswer: string;
}

export const hasReachedQuizCompletionThreshold = (
  accumulatedCorrect: number,
  totalQuestions: number,
) => totalQuestions > 0 && accumulatedCorrect >= totalQuestions;

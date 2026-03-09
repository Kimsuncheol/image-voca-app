import {
  generateQuizQuestions,
  hasReachedQuizCompletionThreshold,
  type QuizVocabData,
} from "../src/course/quizUtils";

describe("quizUtils", () => {
  const buildVocab = (): QuizVocabData[] => [
    {
      word: "alpha",
      meaning: "first",
      example: "Alpha example",
      translation: "첫 번째",
    },
    {
      word: "beta",
      meaning: "second",
      example: "Beta example",
      translation: "두 번째",
    },
    {
      word: "gamma",
      meaning: "third",
      example: "Gamma example",
      translation: "세 번째",
    },
    {
      word: "delta",
      meaning: "fourth",
      example: "Delta example",
      translation: "네 번째",
    },
  ];

  it("generates quiz questions from all fetched words", () => {
    const questions = generateQuizQuestions(buildVocab(), "multiple-choice");

    expect(questions).toHaveLength(4);
    expect(new Set(questions.map((question) => question.word)).size).toBe(4);
  });

  it("uses total question count as the completion threshold", () => {
    expect(hasReachedQuizCompletionThreshold(4, 4)).toBe(true);
    expect(hasReachedQuizCompletionThreshold(3, 4)).toBe(false);
    expect(hasReachedQuizCompletionThreshold(0, 0)).toBe(false);
  });
});

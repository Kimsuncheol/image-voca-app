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
      synonyms: ["primary", " initial ", "primary"],
      pronunciation: "AL-fa",
      pronunciationRoman: "alpha",
      example: "Alpha example",
      translation: "첫 번째",
    },
    {
      word: "beta",
      meaning: "second",
      synonyms: ["secondary"],
      pronunciation: "BAY-ta",
      pronunciationRoman: "beta",
      example: "Beta example",
      translation: "두 번째",
    },
    {
      word: "gamma",
      meaning: "third",
      synonyms: ["tertiary"],
      pronunciation: "GAM-ma",
      pronunciationRoman: "gamma",
      example: "Gamma example",
      translation: "세 번째",
    },
    {
      word: "delta",
      meaning: "fourth",
      synonyms: ["quaternary"],
      pronunciation: "DEL-ta",
      pronunciationRoman: "delta",
      example: "Delta example",
      translation: "네 번째",
    },
  ];

  it("generates quiz questions from all fetched words", () => {
    const questions = generateQuizQuestions(buildVocab(), "multiple-choice");

    expect(questions).toHaveLength(4);
    expect(new Set(questions.map((question) => question.word)).size).toBe(4);
  });

  it("preserves pronunciation fields on matching questions", () => {
    const questions = generateQuizQuestions(buildVocab(), "matching");
    const alphaQuestion = questions.find((question) => question.word === "alpha");

    expect(alphaQuestion).toMatchObject({
      word: "alpha",
      meaning: "first",
      pronunciation: "AL-fa",
      pronunciationRoman: "alpha",
      correctAnswer: "first",
    });
  });

  it("preserves pronunciation fields on fill-in-the-blank questions", () => {
    const questions = generateQuizQuestions(buildVocab(), "fill-in-blank");
    const alphaQuestion = questions.find((question) => question.word === "alpha");

    expect(alphaQuestion).toMatchObject({
      word: "alpha",
      meaning: "first",
      pronunciation: "AL-fa",
      pronunciationRoman: "alpha",
      correctAnswer: "alpha",
      translation: "첫 번째",
    });
    expect(alphaQuestion?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          word: "alpha",
          pronunciation: "AL-fa",
          pronunciationRoman: "alpha",
        }),
      ]),
    );
    expect(alphaQuestion?.clozeSentence).toContain("___");
  });

  it("keeps multiple-choice question behavior unchanged while carrying quiz fields", () => {
    const questions = generateQuizQuestions(buildVocab(), "multiple-choice");
    const alphaQuestion = questions.find((question) => question.word === "alpha");

    expect(alphaQuestion?.correctAnswer).toBe("first");
    expect(alphaQuestion?.options).toEqual(expect.arrayContaining(["first"]));
    expect(alphaQuestion?.clozeSentence).toBeUndefined();
    expect(alphaQuestion?.pronunciation).toBe("AL-fa");
    expect(alphaQuestion?.pronunciationRoman).toBe("alpha");
  });

  it("uses total question count as the completion threshold", () => {
    expect(hasReachedQuizCompletionThreshold(4, 4)).toBe(true);
    expect(hasReachedQuizCompletionThreshold(3, 4)).toBe(false);
    expect(hasReachedQuizCompletionThreshold(0, 0)).toBe(false);
  });

  it("builds synonym-matching questions from words with synonyms", () => {
    const questions = generateQuizQuestions(buildVocab(), "synonym-matching");
    const alphaQuestion = questions.find((question) => question.word === "alpha");

    expect(questions).toHaveLength(4);
    expect(alphaQuestion).toMatchObject({
      word: "alpha",
      meaning: "first",
      synonym: "primary",
      correctAnswer: "primary",
    });
  });
});

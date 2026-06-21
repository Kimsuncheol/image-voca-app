import {
  getLegacyFallbackQuizType,
  getQuizTypesForCourse,
  resolveRuntimeQuizType,
  sanitizeRequestedQuizType,
} from "../src/course/quizModes";

describe("quizModes", () => {
  test("exposes only standard matching for every course", () => {
    expect(getQuizTypesForCourse("TOEIC").map((quizType) => quizType.id)).toEqual([
      "matching",
    ]);
    expect(
      getQuizTypesForCourse("TOEFL_IELTS").map((quizType) => quizType.id),
    ).toEqual(["matching"]);
    expect(
      getQuizTypesForCourse("JLPT_N3").map((quizType) => quizType.id),
    ).toEqual(["matching"]);
    expect(
      getQuizTypesForCourse("KANJI").map((quizType) => quizType.id),
    ).toEqual(["matching"]);
    expect(
      getQuizTypesForCourse("COLLOCATION").map((quizType) => quizType.id),
    ).toEqual(["matching"]);
  });

  test("falls back every legacy or unknown quiz type to matching", () => {
    [
      "spelling",
      "word-arrangement",
      "fill-in-blank",
      "words_placement",
      "synonym-matching",
      "pronunciation-matching",
      "gap-fill-sentence",
      "collocation-matching",
      undefined,
    ].forEach((requestedQuizType) => {
      expect(sanitizeRequestedQuizType("TOEIC", requestedQuizType)).toBe(
        "matching",
      );
      expect(sanitizeRequestedQuizType("COLLOCATION", requestedQuizType)).toBe(
        "matching",
      );
    });
  });

  test("keeps matching as the only fallback and runtime type", () => {
    expect(getLegacyFallbackQuizType("COLLOCATION")).toBe("matching");
    expect(getLegacyFallbackQuizType("TOEIC")).toBe("matching");
    expect(resolveRuntimeQuizType("matching")).toBe("matching");
  });
});

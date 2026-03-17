import {
  getQuizTypesForCourse,
  resolveRuntimeQuizType,
  sanitizeRequestedQuizType,
} from "../src/course/quizModes";

describe("quizModes", () => {
  test("exposes only supported quiz types for standard courses", () => {
    expect(getQuizTypesForCourse("TOEIC").map((quizType) => quizType.id)).toEqual([
      "matching",
      "fill-in-blank",
    ]);
  });

  test("exposes only supported quiz types for collocation", () => {
    expect(
      getQuizTypesForCourse("COLLOCATION").map((quizType) => quizType.id),
    ).toEqual(["gap-fill-sentence", "collocation-matching"]);
  });

  test("falls back removed and unknown standard quiz types to matching", () => {
    expect(sanitizeRequestedQuizType("TOEIC", "spelling")).toBe("matching");
    expect(sanitizeRequestedQuizType("TOEIC", "word-arrangement")).toBe(
      "matching",
    );
    expect(sanitizeRequestedQuizType("TOEIC", "unknown")).toBe("matching");
  });

  test("falls back removed and unknown collocation quiz types to gap-fill-sentence", () => {
    expect(sanitizeRequestedQuizType("COLLOCATION", "error-correction")).toBe(
      "gap-fill-sentence",
    );
    expect(sanitizeRequestedQuizType("COLLOCATION", "word-order-tiles")).toBe(
      "gap-fill-sentence",
    );
    expect(sanitizeRequestedQuizType("COLLOCATION", "unknown")).toBe(
      "gap-fill-sentence",
    );
  });

  test("keeps supported quiz types and resolves runtime aliases", () => {
    expect(sanitizeRequestedQuizType("TOEIC", "fill-in-blank")).toBe(
      "fill-in-blank",
    );
    expect(sanitizeRequestedQuizType("JLPT_N3", "matching")).toBe("matching");
    expect(sanitizeRequestedQuizType("COLLOCATION", "collocation-matching")).toBe(
      "collocation-matching",
    );
    expect(resolveRuntimeQuizType("gap-fill-sentence")).toBe("fill-in-blank");
    expect(resolveRuntimeQuizType("collocation-matching")).toBe("matching");
  });
});

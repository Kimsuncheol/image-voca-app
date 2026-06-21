import { hasReachedQuizCompletionThreshold } from "../src/course/quizUtils";

describe("quizUtils", () => {
  it("uses total question count as the completion threshold", () => {
    expect(hasReachedQuizCompletionThreshold(4, 4)).toBe(true);
    expect(hasReachedQuizCompletionThreshold(3, 4)).toBe(false);
    expect(hasReachedQuizCompletionThreshold(0, 0)).toBe(false);
  });
});

import { isFillInBlankAnswerCorrect } from "../src/utils/fillInBlankAnswer";

describe("isFillInBlankAnswerCorrect", () => {
  it("matches English answers case-insensitively", () => {
    expect(
      isFillInBlankAnswerCorrect({
        answer: "  ALPHA ",
        correctAnswer: "alpha",
        language: "en",
      }),
    ).toBe(true);
  });

  it("matches accepted correct forms", () => {
    expect(
      isFillInBlankAnswerCorrect({
        answer: "went",
        correctAnswer: "go",
        correctForms: ["went"],
        language: "en",
      }),
    ).toBe(true);
  });

  it("matches Japanese answers exactly after trimming", () => {
    expect(
      isFillInBlankAnswerCorrect({
        answer: " 雨 ",
        correctAnswer: "雨",
        language: "ja",
      }),
    ).toBe(true);
    expect(
      isFillInBlankAnswerCorrect({
        answer: "あめ",
        correctAnswer: "雨",
        language: "ja",
      }),
    ).toBe(false);
  });

  it("rejects empty submissions", () => {
    expect(
      isFillInBlankAnswerCorrect({
        answer: "   ",
        correctAnswer: "alpha",
        language: "en",
      }),
    ).toBe(false);
  });
});

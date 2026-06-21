import { doc, getDoc } from "firebase/firestore";
import {
  buildCourseQuizDocPathSegments,
  fetchCourseQuizData,
  normalizeFirestoreCourseQuiz,
  resolveFirestoreQuizText,
} from "../../src/services/courseQuizDataService";

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...segments: unknown[]) => segments.join("/")),
  getDoc: jest.fn(),
}));

describe("courseQuizDataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the course Day matching quiz data path", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    await fetchCourseQuizData("TOEIC", 5, "matching", "en");

    expect(doc).toHaveBeenCalledWith(
      {},
      "courses/toeic",
      "Day5",
      "Day5-quiz",
      "matching",
      "data",
    );
    expect(buildCourseQuizDocPathSegments("TOEIC", 5, "matching")).toEqual([
      "courses/toeic",
      "Day5",
      "Day5-quiz",
      "matching",
      "data",
    ]);
  });

  it("resolves localized text with app-language fallback", () => {
    expect(
      resolveFirestoreQuizText(
        { meaningEnglish: "reason", meaningKorean: "이유" },
        undefined,
        "ko",
      ),
    ).toBe("이유");
    expect(
      resolveFirestoreQuizText(
        { meaningEnglish: "reason", meaningKorean: "이유" },
        "meaningEnglish",
        "ko",
      ),
    ).toBe("reason");
  });

  it("normalizes matching quizzes while preserving saved choice order", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
        meaning_language: "ko",
        items: [
          { id: "i1", text: "alpha" },
          { id: "i2", text: "beta" },
        ],
        choices: [
          {
            id: "c2",
            text: { meaningEnglish: "second", meaningKorean: "둘째" },
          },
          {
            id: "c1",
            text: { meaningEnglish: "first", meaningKorean: "첫째" },
          },
        ],
        answer_key: [
          { item_id: "i1", choice_id: "c1" },
          { item_id: "i2", choice_id: "c2" },
        ],
      },
      "en",
    );

    expect(result?.questions).toEqual([
      expect.objectContaining({
        word: "alpha",
        meaning: "첫째",
        matchItemId: "i1",
        matchChoiceId: "c1",
      }),
      expect.objectContaining({
        word: "beta",
        meaning: "둘째",
        matchItemId: "i2",
        matchChoiceId: "c2",
      }),
    ]);
    expect(result?.matchingChoices).toEqual(["둘째", "첫째"]);
  });

  it("localizes JLPT matching choice meanings by app language", () => {
    const data = {
      items: [
        { id: "i1", word: "間" },
        { id: "i2", word: "入口" },
      ],
      choices: [
        {
          id: "c2",
          meaningEnglish: "entrance",
          meaningKorean: "입구",
        },
        {
          id: "c1",
          meaningEnglish: "interval; between",
          meaningKorean: "사이",
        },
      ],
      answer_key: [
        { item_id: "i1", choice_id: "c1" },
        { item_id: "i2", choice_id: "c2" },
      ],
    };

    const english = normalizeFirestoreCourseQuiz(
      "matching",
      data,
      "en",
      "JLPT_N5",
    );
    const korean = normalizeFirestoreCourseQuiz(
      "matching",
      data,
      "ko",
      "JLPT_N5",
    );

    expect(english?.questions[0]).toMatchObject({
      word: "間",
      meaning: "interval; between",
      matchChoiceText: "interval; between",
      correctAnswer: "interval; between",
    });
    expect(korean?.questions[0]).toMatchObject({
      word: "間",
      meaning: "사이",
      matchChoiceText: "사이",
      correctAnswer: "사이",
    });
    expect(korean?.matchingChoices).toEqual(["입구", "사이"]);
  });

  it("normalizes matching quizzes with camelCase answer keys and alternate text fields", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
        meaning_language: "meaningEnglish",
        items: [
          { id: "i1", word: "alpha" },
          {
            id: "i2",
            meaning: { meaningEnglish: "beta", meaningKorean: "베타" },
          },
        ],
        choices: [
          { id: "c1", meaning: "first" },
          {
            id: "c2",
            meaningEnglish: "second",
            meaningKorean: "둘째",
          },
        ],
        answerKey: [
          { itemId: "i1", choiceId: "c1" },
          { itemId: "i2", choiceId: "c2" },
        ],
      },
      "ko",
    );

    expect(result?.questions).toEqual([
      expect.objectContaining({
        word: "alpha",
        meaning: "first",
        matchItemId: "i1",
        matchChoiceId: "c1",
      }),
      expect.objectContaining({
        word: "beta",
        meaning: "second",
        matchItemId: "i2",
        matchChoiceId: "c2",
      }),
    ]);
    expect(result?.matchingChoices).toEqual(["first", "second"]);
  });

  it("returns null and logs a reason for invalid matching data", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        items: [{ id: "i1", text: "alpha" }],
        choices: [{ id: "c1", text: "first" }],
        answer_key: [{ item_id: "i1", choice_id: "missing" }],
      }),
    });

    await expect(
      fetchCourseQuizData("TOEIC", 1, "matching", "en"),
    ).resolves.toBeNull();

    expect(logSpy).toHaveBeenCalledWith(
      "[CourseQuizData] normalization failed",
      expect.objectContaining({
        reason: "choice missing for item i1 is missing or invalid",
      }),
    );

    logSpy.mockRestore();
  });
});

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
  collection: jest.fn(),
  doc: jest.fn((...segments: unknown[]) => segments.join("/")),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe("courseQuizDataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the TOEIC Day 5 matching quiz data path", async () => {
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

  it("maps fill-in-blank to the fill_in_the_blank quiz collection", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        questions: [
          {
            id: "q1",
            sentence: "The answer is _____.",
            translation_english: "The answer is blank.",
            options: [
              { id: "a", text: "alpha" },
              { id: "b", text: "beta" },
            ],
            answer_id: "b",
            answer_text: "beta",
          },
        ],
      }),
    });

    const result = await fetchCourseQuizData("TOEIC", 2, "fill-in-blank", "en");

    expect(doc).toHaveBeenCalledWith(
      {},
      "courses/toeic",
      "Day2",
      "Day2-quiz",
      "fill_in_the_blank",
      "data",
    );
    expect(result?.questions[0]).toMatchObject({
      id: "q1",
      word: "beta",
      correctAnswer: "beta",
      clozeSentence: "The answer is _____.",
      translation: "The answer is blank.",
    });
  });

  it("builds the JLPT N5 Day 1 fill-in-blank quiz data path", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => false,
    });

    await fetchCourseQuizData("JLPT_N5", 1, "fill-in-blank", "en");

    expect(doc).toHaveBeenCalledWith(
      {},
      "courses/jlpt/n5",
      "Day1",
      "Day1-quiz",
      "fill_in_the_blank",
      "data",
    );
    expect(buildCourseQuizDocPathSegments("JLPT_N5", 1, "fill-in-blank")).toEqual([
      "courses/jlpt/n5",
      "Day1",
      "Day1-quiz",
      "fill_in_the_blank",
      "data",
    ]);
  });

  it("resolves object text with meaning_language", () => {
    expect(
      resolveFirestoreQuizText(
        { meaningEnglish: "reason", meaningKorean: "이유" },
        "meaningKorean",
        "en",
      ),
    ).toBe("이유");
    expect(
      resolveFirestoreQuizText(
        { meaningEnglish: "reason", meaningKorean: "이유" },
        undefined,
        "en",
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

  it("localizes JLPT matching choice meanings to English", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
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
      },
      "en",
      "JLPT_N5",
    );

    expect(result?.questions).toEqual([
      expect.objectContaining({
        word: "間",
        meaning: "interval; between",
        matchChoiceText: "interval; between",
        correctAnswer: "interval; between",
      }),
      expect.objectContaining({
        word: "入口",
        meaning: "entrance",
        matchChoiceText: "entrance",
        correctAnswer: "entrance",
      }),
    ]);
    expect(result?.matchingChoices).toEqual(["entrance", "interval; between"]);
  });

  it("localizes JLPT matching choice meanings to Korean", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
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
      },
      "ko",
      "JLPT_N5",
    );

    expect(result?.questions).toEqual([
      expect.objectContaining({
        word: "間",
        meaning: "사이",
        matchChoiceText: "사이",
        correctAnswer: "사이",
      }),
      expect.objectContaining({
        word: "入口",
        meaning: "입구",
        matchChoiceText: "입구",
        correctAnswer: "입구",
      }),
    ]);
    expect(result?.matchingChoices).toEqual(["입구", "사이"]);
  });

  it("uses available JLPT matching meaning when one localized field is missing", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
        items: [{ id: "i1", word: "間" }],
        choices: [{ id: "c1", meaningEnglish: "interval; between" }],
        answer_key: [{ item_id: "i1", choice_id: "c1" }],
      },
      "ko",
      "JLPT_N5",
    );

    expect(result?.questions[0]).toMatchObject({
      word: "間",
      meaning: "interval; between",
      matchChoiceText: "interval; between",
      correctAnswer: "interval; between",
    });
    expect(result?.matchingChoices).toEqual(["interval; between"]);
  });

  it("prefers literal meaning for non-JLPT matching choices", () => {
    const result = normalizeFirestoreCourseQuiz(
      "matching",
      {
        meaning_language: "meaningKorean",
        items: [{ id: "i1", word: "alpha" }],
        choices: [
          {
            id: "c1",
            meaning: "literal meaning",
            meaningEnglish: "English meaning",
            meaningKorean: "한국어 뜻",
          },
        ],
        answer_key: [{ item_id: "i1", choice_id: "c1" }],
      },
      "ko",
      "TOEIC",
    );

    expect(result?.questions[0]).toMatchObject({
      word: "alpha",
      meaning: "literal meaning",
      matchChoiceText: "literal meaning",
      correctAnswer: "literal meaning",
    });
    expect(result?.matchingChoices).toEqual(["literal meaning"]);
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

  it("normalizes fill-in-the-blank translation fields by app language with fallback", () => {
    const englishResult = normalizeFirestoreCourseQuiz(
      "fill_in_the_blank",
      {
        questions: [
          {
            id: "q1",
            sentence: "Alpha ____.",
            translationEnglish: "Alpha beta.",
            translationKorean: "알파 베타.",
            options: [
              { id: "a", text: "alpha" },
              { id: "b", text: "beta" },
            ],
            answer_id: "b",
            answer_text: "beta",
          },
          {
            id: "q2",
            sentence: "Gamma ____.",
            translation_korean: "감마 델타.",
            translation: "Fallback translation.",
            options: [
              { id: "g", text: "gamma" },
              { id: "d", text: "delta" },
            ],
            answer_id: "d",
            answer_text: "delta",
          },
        ],
      },
      "en",
    );
    const koreanResult = normalizeFirestoreCourseQuiz(
      "fill_in_the_blank",
      {
        questions: [
          {
            id: "q1",
            sentence: "Alpha ____.",
            translationEnglish: "Alpha beta.",
            translationKorean: "알파 베타.",
            options: [
              { id: "a", text: "alpha" },
              { id: "b", text: "beta" },
            ],
            answer_id: "b",
            answer_text: "beta",
          },
          {
            id: "q2",
            sentence: "Gamma ____.",
            translation_english: "Gamma delta.",
            translation: "Fallback translation.",
            options: [
              { id: "g", text: "gamma" },
              { id: "d", text: "delta" },
            ],
            answer_id: "d",
            answer_text: "delta",
          },
        ],
      },
      "ko",
    );

    expect(englishResult?.questions.map((question) => question.translation)).toEqual([
      "Alpha beta.",
      "감마 델타.",
    ]);
    expect(koreanResult?.questions.map((question) => question.translation)).toEqual([
      "알파 베타.",
      "Gamma delta.",
    ]);
  });

  it("logs a matching normalization reason for invalid choice ids", async () => {
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

  it("returns null for missing documents and malformed quiz data", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });
    await expect(fetchCourseQuizData("TOEIC", 1, "matching")).resolves.toBeNull();

    expect(
      normalizeFirestoreCourseQuiz("matching", {
        items: [{ id: "i1", text: "alpha" }],
        choices: [{ id: "c1", text: "first" }],
        answer_key: [{ item_id: "i1", choice_id: "missing" }],
      }),
    ).toBeNull();

    expect(
      normalizeFirestoreCourseQuiz("fill_in_the_blank", {
        questions: [
          {
            id: "q1",
            sentence: "Pick ____.",
            options: [{ id: "a", text: "alpha" }],
            answer_id: "missing",
            answer_text: "beta",
          },
        ],
      }),
    ).toBeNull();
  });
});

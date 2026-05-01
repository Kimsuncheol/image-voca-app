import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import {
  buildPopQuizDocPathSegments,
  fetchPopQuizMatchingGamesBatch,
  fetchPopQuizMatchingGame,
  getPopQuizCacheKey,
  getPopQuizStorageLevel,
  normalizePopQuizMatchingGame,
} from "../../src/services/popQuizService";

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...segments: unknown[]) => segments.join("/")),
  getDoc: jest.fn(),
}));

const englishQuiz = {
  quiz_type: "matching",
  language: "english",
  course: "TOEIC",
  level: null,
  day: 1,
  items: [
    { id: "q1", word: "make a decision", meaning: "decide" },
    { id: "q2", word: "book", meaning: "printed work" },
  ],
  choices: [
    { id: "c1", meaning: "decide" },
    { id: "c2", meaning: "printed work" },
  ],
  answer_key: [
    { item_id: "q1", choice_id: "c1" },
    { item_id: "q2", choice_id: "c2" },
  ],
};

const japaneseQuiz = {
  quiz_type: "matching",
  language: "japanese",
  course: "JLPT",
  level: "N2",
  day: 3,
  items: [
    {
      id: "q1",
      word: "解決",
      meaningEnglish: "solution",
      meaningKorean: "해결",
    },
  ],
  choices: [
    {
      id: "c1",
      meaningEnglish: "solution",
      meaningKorean: "해결",
    },
  ],
  answer_key: [{ item_id: "q1", choice_id: "c1" }],
};

const englishQuizDay2 = {
  ...englishQuiz,
  day: 2,
  items: [{ id: "q3", word: "water", meaning: "liquid" }],
  choices: [{ id: "c3", meaning: "liquid" }],
  answer_key: [{ item_id: "q3", choice_id: "c3" }],
};

describe("popQuizService", () => {
  const originalEnglishPath = process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH;
  const originalJapanesePath = process.env.EXPO_PUBLIC_POP_QUIZ_JAPANESE;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH =
      "/pop-quiz/root/English/base/matching";
    process.env.EXPO_PUBLIC_POP_QUIZ_JAPANESE =
      "/pop-quiz/root/Japanese/base/matching";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH = originalEnglishPath;
    process.env.EXPO_PUBLIC_POP_QUIZ_JAPANESE = originalJapanesePath;
  });

  it("reads English pop quiz data from the configured matching data document", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        courses: {
          TOEIC: {
            days: {
              "1": englishQuiz,
            },
          },
        },
      }),
    });

    const result = await fetchPopQuizMatchingGame({
      language: "en",
      course: "TOEIC",
      day: 1,
      appLanguage: "en",
    });

    expect(buildPopQuizDocPathSegments("en")).toEqual([
      "pop-quiz",
      "root",
      "English",
      "base",
      "matching",
      "data",
    ]);
    expect(doc).toHaveBeenCalledWith(
      {},
      "pop-quiz",
      "root",
      "English",
      "base",
      "matching",
      "data",
    );
    expect(result.game?.items.map((item) => item.word)).toEqual([
      "make a decision",
      "book",
    ]);
    expect(result.game?.choices.map((choice) => choice.text)).toEqual([
      "decide",
      "printed work",
    ]);
  });

  it("batch fetches multiple English days with one document read and caches each day", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        courses: {
          TOEIC: {
            days: {
              "1": englishQuiz,
              "2": englishQuizDay2,
            },
          },
        },
      }),
    });

    const result = await fetchPopQuizMatchingGamesBatch({
      language: "en",
      course: "TOEIC",
      days: [1, 2],
      appLanguage: "en",
    });

    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(result[1].game?.items[0].word).toBe("make a decision");
    expect(result[2].game?.items[0].word).toBe("water");

    (getDoc as jest.Mock).mockClear();
    const cachedResult = await fetchPopQuizMatchingGamesBatch({
      language: "en",
      course: "TOEIC",
      days: [1, 2],
      appLanguage: "en",
    });

    expect(getDoc).not.toHaveBeenCalled();
    expect(cachedResult[1].game?.choices[0].text).toBe("decide");
    expect(cachedResult[2].game?.choices[0].text).toBe("liquid");
  });

  it("batch fetch preserves current day when the next day is missing", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        courses: {
          TOEIC: {
            days: {
              "1": englishQuiz,
            },
          },
        },
      }),
    });

    const result = await fetchPopQuizMatchingGamesBatch({
      language: "en",
      course: "TOEIC",
      days: [1, 2],
      appLanguage: "en",
    });

    expect(result[1].game?.day).toBe(1);
    expect(result[2]).toEqual({ game: null, reason: "missing-day" });
  });

  it("maps JLPT course ids to Japanese levels before reading nested day data", async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        levels: {
          N2: {
            days: {
              "3": japaneseQuiz,
            },
          },
        },
      }),
    });

    const result = await fetchPopQuizMatchingGame({
      language: "ja",
      course: "JLPT_N2",
      day: 3,
      appLanguage: "en",
    });

    expect(getPopQuizStorageLevel("JLPT_N2")).toBe("N2");
    expect(doc).toHaveBeenCalledWith(
      {},
      "pop-quiz",
      "root",
      "Japanese",
      "base",
      "matching",
      "data",
    );
    expect(result.game?.level).toBe("N2");
    expect(result.game?.choices[0].text).toBe("solution");
  });

  it("localizes Japanese choice text to Korean when the app language is Korean", () => {
    const result = normalizePopQuizMatchingGame(japaneseQuiz, "ko-KR");

    expect(result?.choices[0].text).toBe("해결");
  });

  it("prefers Japanese meaningEnglish over legacy text and meaning for English UI", () => {
    const result = normalizePopQuizMatchingGame(
      {
        ...japaneseQuiz,
        choices: [
          {
            id: "c1",
            text: "legacy text",
            meaning: "legacy meaning",
            meaningEnglish: "solution",
            meaningKorean: "해결",
          },
        ],
      },
      "en",
    );

    expect(result?.choices[0].text).toBe("solution");
  });

  it("prefers Japanese meaningKorean over legacy text and meaning for Korean UI", () => {
    const result = normalizePopQuizMatchingGame(
      {
        ...japaneseQuiz,
        choices: [
          {
            id: "c1",
            text: "legacy text",
            meaning: "legacy meaning",
            meaningEnglish: "solution",
            meaningKorean: "해결",
          },
        ],
      },
      "ko-KR",
    );

    expect(result?.choices[0].text).toBe("해결");
  });

  it("normalizes Japanese item labels from vocabulary fields only", () => {
    const result = normalizePopQuizMatchingGame(
      {
        ...japaneseQuiz,
        items: [
          {
            id: "q1",
            kanji: "解決",
            meaningEnglish: "solution",
            meaningKorean: "해결",
          },
          {
            id: "q2",
            collocation: "目標を達成する",
            meaningEnglish: "achieve a goal",
          },
          {
            id: "q3",
            idiom: "猫の手も借りたい",
            meaningEnglish: "extremely busy",
          },
          {
            id: "q4",
            word: "確認",
            kanji: "確",
            meaningEnglish: "confirmation",
          },
        ],
        choices: [
          { id: "c1", meaningEnglish: "solution", meaningKorean: "해결" },
          { id: "c2", meaningEnglish: "achieve a goal" },
          { id: "c3", meaningEnglish: "extremely busy" },
          { id: "c4", meaningEnglish: "confirmation" },
        ],
        answer_key: [
          { item_id: "q1", choice_id: "c1" },
          { item_id: "q2", choice_id: "c2" },
          { item_id: "q3", choice_id: "c3" },
          { item_id: "q4", choice_id: "c4" },
        ],
      },
      "en",
    );

    expect(result?.items.map((item) => item.word)).toEqual([
      "解決",
      "目標を達成する",
      "猫の手も借りたい",
      "確認",
    ]);
    expect(result?.choices.map((choice) => choice.text)).toEqual([
      "solution",
      "achieve a goal",
      "extremely busy",
      "confirmation",
    ]);
  });

  it("rejects item payloads that only provide meaning fields for the left column", () => {
    expect(
      normalizePopQuizMatchingGame({
        ...japaneseQuiz,
        items: [
          {
            id: "q1",
            text: "display text",
            meaningEnglish: "solution",
            meaningKorean: "해결",
          },
        ],
      }),
    ).toBeNull();
  });

  it("relocalizes cached Japanese quizzes for the current app language", async () => {
    await AsyncStorage.setItem(
      getPopQuizCacheKey({
        language: "japanese",
        level: "N2",
        day: 3,
      }),
      JSON.stringify({
        ...japaneseQuiz,
        choices: [{ id: "c1", text: "solution", meaningKorean: "해결" }],
      }),
    );

    const result = await fetchPopQuizMatchingGame({
      language: "ja",
      course: "JLPT_N2",
      day: 3,
      appLanguage: "ko",
    });

    expect(getDoc).not.toHaveBeenCalled();
    expect(result.game?.choices[0].text).toBe("해결");
  });

  it("returns null results for missing config, missing days, and malformed payloads", async () => {
    delete process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH;
    await expect(
      fetchPopQuizMatchingGame({
        language: "en",
        course: "TOEIC",
        day: 1,
      }),
    ).resolves.toEqual({ game: null, reason: "missing-config" });

    process.env.EXPO_PUBLIC_POP_QUIZ_ENGLISH =
      "/pop-quiz/root/English/base/matching";
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        courses: {
          TOEIC: {
            days: {},
          },
        },
      }),
    });
    await expect(
      fetchPopQuizMatchingGame({
        language: "en",
        course: "TOEIC",
        day: 9,
      }),
    ).resolves.toEqual({ game: null, reason: "missing-day" });

    expect(
      normalizePopQuizMatchingGame({
        ...englishQuiz,
        choices: [{ id: "other", meaning: "wrong" }],
      }),
    ).toBeNull();
  });
});

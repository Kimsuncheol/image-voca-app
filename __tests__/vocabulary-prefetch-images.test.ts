import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCourseConfig,
  hydrateVocabularyCache,
  mapVocabularyDocToCard,
  normalizeVocabularyCard,
  normalizeVocabularyImageUrl,
} from "../src/services/vocabularyPrefetch";
import { VocabularyCard } from "../src/types/vocabulary";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

describe("vocabulary image normalization", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("normalizes a direct imageUrl string", () => {
    expect(normalizeVocabularyImageUrl(" https://cdn.example.com/card.jpg ")).toBe(
      "https://cdn.example.com/card.jpg",
    );
  });

  it("maps a normal course document using imageUrl", () => {
    const card = mapVocabularyDocToCard(
      "doc-1",
      {
        word: "abandon",
        meaning: "leave behind",
        pronunciation: "/ab/",
        pronunciationRoman: "ab",
        example: "They abandoned it.",
        imageUrl: "https://cdn.example.com/abandon.jpg",
        localized: {
          en: {
            meaning: "leave behind",
          },
          ko: {
            meaning: "버리다",
            translation: "포기하다",
          },
        },
      },
      "TOEIC",
    );

    expect(card.imageUrl).toBe("https://cdn.example.com/abandon.jpg");
    expect(card.word).toBe("abandon");
    expect(card.pronunciationRoman).toBe("ab");
    expect(card.localized?.ko?.meaning).toBe("버리다");
  });

  it("maps a normal course document using legacy image", () => {
    const card = mapVocabularyDocToCard(
      "doc-2",
      {
        word: "adapt",
        meaning: "adjust",
        example: "Adapt quickly.",
        image: "https://cdn.example.com/adapt.jpg",
      },
      "TOEIC",
    );

    expect(card.imageUrl).toBe("https://cdn.example.com/adapt.jpg");
  });

  it("maps a collocation document using imageUrl", () => {
    const card = mapVocabularyDocToCard(
      "doc-3",
      {
        collocation: "raise questions",
        meaning: "cause doubt",
        explanation: "phrase",
        example: "The result raised questions.",
        imageUrl: "https://cdn.example.com/questions.jpg",
      },
      "COLLOCATION",
    );

    expect(card.word).toBe("raise questions");
    expect(card.imageUrl).toBe("https://cdn.example.com/questions.jpg");
  });

  it("maps exampleRoman for JLPT documents", () => {
    const card = mapVocabularyDocToCard(
      "jlpt-1",
      {
        word: "間",
        meaningEnglish: "between",
        pronunciation: "あいだ",
        pronunciationRoman: "aida",
        example: "駅とホテルの間",
        exampleRoman: "eki to hoteru no aida",
      },
      "JLPT_N5",
    );

    expect(card.exampleRoman).toBe("eki to hoteru no aida");
    expect(card.example).toBe("駅とホテルの間");
  });

  it("leaves imageUrl undefined when no image fields exist", () => {
    const card = mapVocabularyDocToCard(
      "doc-4",
      {
        word: "measure",
        meaning: "assess",
        example: "Measure twice.",
      },
      "TOEIC",
    );

    expect(card.imageUrl).toBeUndefined();
  });

  it("drops the legacy image field when normalizing cached cards", () => {
    const normalized = normalizeVocabularyCard({
      id: "card-1",
      word: "build",
      meaning: "construct",
      example: "Build carefully.",
      exampleRoman: "build carefully",
      course: "TOEIC",
      image: "https://cdn.example.com/build.jpg",
    } as VocabularyCard & { image?: string });

    expect(normalized.imageUrl).toBe("https://cdn.example.com/build.jpg");
    expect(normalized.exampleRoman).toBe("build carefully");
    expect("image" in normalized).toBe(false);
  });

  it("hydrates legacy cached cards into imageUrl", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v3:TOEIC-Day1",
      JSON.stringify({
        updatedAt: Date.now(),
        cards: [
          {
            id: "cached-1",
            word: "carry",
            meaning: "transport",
            example: "Carry this bag.",
            course: "TOEIC",
            image: "https://cdn.example.com/carry.jpg",
          },
        ],
      }),
    );

    const cards = await hydrateVocabularyCache("TOEIC", 1);

    expect(cards).toHaveLength(1);
    expect(cards?.[0].imageUrl).toBe("https://cdn.example.com/carry.jpg");
    expect("image" in (cards?.[0] ?? {})).toBe(false);
  });

  it("hydrates localized cache entries", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v3:TOEIC-Day2",
      JSON.stringify({
        updatedAt: Date.now(),
        cards: [
          {
            id: "cached-2",
            word: "adapt",
            meaning: "adjust",
            pronunciation: "/əˈdæpt/",
            pronunciationRoman: "a-daept",
            example: "Adapt fast.",
            course: "TOEIC",
            localized: {
              en: { meaning: "adjust" },
              ko: { meaning: "적응하다", translation: "맞추다" },
            },
          },
        ],
      }),
    );

    const cards = await hydrateVocabularyCache("TOEIC", 2);

    expect(cards?.[0].localized?.ko?.meaning).toBe("적응하다");
    expect(cards?.[0].pronunciationRoman).toBe("a-daept");
  });

  it("ignores older v2 cache entries so fresh data can repopulate new fields", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v2:JLPT_N5-Day1",
      JSON.stringify({
        updatedAt: Date.now(),
        cards: [
          {
            id: "cached-jlpt-1",
            word: "間",
            meaning: "between",
            example: "駅とホテルの間",
            course: "JLPT_N5",
          },
        ],
      }),
    );

    const cards = await hydrateVocabularyCache("JLPT_N5", 1);

    expect(cards).toBeNull();
  });

  it("resolves JLPT level paths through the shared course config", () => {
    expect(getCourseConfig("JLPT_N1")).toEqual({
      path: "courses/jlpt/n1",
      prefix: "JLPT_N1",
    });
  });
});

import { act, render } from "@testing-library/react-native";
import React from "react";
import { useQuizBatchFetcher } from "../components/dashboard/hooks/useQuizBatchFetcher";
import {
  fetchVocabularyCardsFromFirestore,
  getCachedVocabularyCards,
  getCourseConfig,
  getTotalDaysForCourse,
} from "../src/services/vocabularyPrefetch";
import type { CourseType, VocabularyCard } from "../src/types/vocabulary";

jest.mock("../src/services/vocabularyPrefetch", () => ({
  fetchVocabularyCardsFromFirestore: jest.fn(),
  getCachedVocabularyCards: jest.fn(),
  getCourseConfig: jest.fn(),
  getTotalDaysForCourse: jest.fn(),
}));

const buildCard = (
  id: string,
  word: string,
  course: CourseType = "TOEIC",
): VocabularyCard => ({
  id,
  word,
  meaning: `${word}-meaning`,
  example: `${word}-example`,
  course,
});

let latestHook:
  | ReturnType<typeof useQuizBatchFetcher>
  | null = null;

function HookHarness({
  courseConfigs,
}: {
  courseConfigs: { id: CourseType; wordsPerCourse: number }[];
}) {
  latestHook = useQuizBatchFetcher(courseConfigs);
  return null;
}

describe("useQuizBatchFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestHook = null;
    (getCourseConfig as jest.Mock).mockReturnValue({ path: "courses/toeic" });
    (getTotalDaysForCourse as jest.Mock).mockResolvedValue(20);
    (getCachedVocabularyCards as jest.Mock).mockReturnValue(undefined);
    (fetchVocabularyCardsFromFirestore as jest.Mock).mockResolvedValue([
      buildCard("1", "alpha"),
      buildCard("2", "beta"),
      buildCard("3", "gamma"),
      buildCard("4", "delta"),
    ]);
  });

  it("reuses shared cached day data before hitting Firestore", async () => {
    (getCachedVocabularyCards as jest.Mock).mockReturnValue([
      buildCard("1", "cached-alpha"),
      buildCard("2", "cached-beta"),
      buildCard("3", "cached-gamma"),
      buildCard("4", "cached-delta"),
    ]);

    render(
      <HookHarness courseConfigs={[{ id: "TOEIC", wordsPerCourse: 4 }]} />,
    );

    let batch: VocabularyCard[] = [];
    await act(async () => {
      batch = await latestHook!.fetchBatch();
    });

    expect(batch).toHaveLength(4);
    expect(batch.map((card) => card.word)).toEqual(
      expect.arrayContaining([
        "cached-alpha",
        "cached-beta",
        "cached-gamma",
        "cached-delta",
      ]),
    );
    expect(fetchVocabularyCardsFromFirestore).not.toHaveBeenCalled();
  });

  it("stops day probing once enough words have been collected", async () => {
    (fetchVocabularyCardsFromFirestore as jest.Mock).mockResolvedValue(
      Array.from({ length: 15 }, (_, index) =>
        buildCard(`word-${index}`, `word-${index}`),
      ),
    );

    render(
      <HookHarness courseConfigs={[{ id: "TOEIC", wordsPerCourse: 8 }]} />,
    );

    let batch: VocabularyCard[] = [];
    await act(async () => {
      batch = await latestHook!.fetchBatch();
    });

    expect(batch).toHaveLength(8);
    expect(fetchVocabularyCardsFromFirestore).toHaveBeenCalledTimes(1);
  });

  it("consumes collocation cards through the shared fetch helper", async () => {
    (fetchVocabularyCardsFromFirestore as jest.Mock).mockResolvedValue([
      buildCard("1", "take place", "COLLOCATION"),
      buildCard("2", "make progress", "COLLOCATION"),
      buildCard("3", "pay attention", "COLLOCATION"),
      buildCard("4", "raise questions", "COLLOCATION"),
    ]);

    render(
      <HookHarness courseConfigs={[{ id: "COLLOCATION", wordsPerCourse: 4 }]} />,
    );

    let batch: VocabularyCard[] = [];
    await act(async () => {
      batch = await latestHook!.fetchBatch();
    });

    expect(batch).toHaveLength(4);
    expect(batch.every((card) => card.course === "COLLOCATION")).toBe(true);
    expect(fetchVocabularyCardsFromFirestore).toHaveBeenCalledWith(
      "COLLOCATION",
      expect.any(Number),
      { limitCount: 15 },
    );
  });
});

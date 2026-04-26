import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearResumeProgress,
  getResumeProgress,
  saveResumeProgress,
  validateResumeProgress,
} from "../src/services/vocabularyDayResume";
import { CourseVocabularyCard } from "../src/types/vocabulary";

const cards: CourseVocabularyCard[] = [
  {
    id: "word-1",
    word: "abandon",
    meaning: "leave",
    example: "They abandon the idea.",
    course: "TOEIC",
  },
  {
    id: "word-2",
    word: "retain",
    meaning: "keep",
    example: "Retain the record.",
    course: "TOEIC",
  },
];

describe("vocabulary day resume storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("saves and reads valid resume progress", async () => {
    const saved = await saveResumeProgress({
      userId: "user-1",
      courseId: "TOEIC",
      dayNumber: 1,
      cards,
      currentIndex: 1,
    });

    expect(saved).toEqual(
      expect.objectContaining({
        courseId: "TOEIC",
        dayNumber: 1,
        currentIndex: 1,
        cardId: "word-2",
      }),
    );

    await expect(
      getResumeProgress({
        userId: "user-1",
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        currentIndex: 1,
        cardId: "word-2",
      }),
    );
  });

  it("clears saved resume progress", async () => {
    await saveResumeProgress({
      userId: "user-1",
      courseId: "TOEIC",
      dayNumber: 1,
      cards,
      currentIndex: 0,
    });

    await clearResumeProgress({
      userId: "user-1",
      courseId: "TOEIC",
      dayNumber: 1,
    });

    await expect(
      getResumeProgress({
        userId: "user-1",
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).resolves.toBeNull();
  });

  it("rejects stale or mismatched resume progress", () => {
    const validShape = {
      courseId: "TOEIC",
      dayNumber: 1,
      currentIndex: 1,
      cardId: "word-2",
      updatedAt: "2026-04-27T00:00:00.000Z",
    };

    expect(
      validateResumeProgress({
        value: { ...validShape, courseId: "TOEFL_IELTS" },
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).toBeNull();

    expect(
      validateResumeProgress({
        value: { ...validShape, dayNumber: 2 },
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).toBeNull();

    expect(
      validateResumeProgress({
        value: { ...validShape, currentIndex: 9 },
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).toBeNull();

    expect(
      validateResumeProgress({
        value: { ...validShape, cardId: "word-1" },
        courseId: "TOEIC",
        dayNumber: 1,
        cards,
      }),
    ).toBeNull();
  });
});

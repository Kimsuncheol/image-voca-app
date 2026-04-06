import {
  buildUpsertedDailyStudyHistoryDoc,
  type DailyStudyHistoryDoc,
} from "../src/utils/dailyStudyHistory";

describe("dailyStudyHistory", () => {
  it("creates a new daily history doc with the provided entry", () => {
    const result = buildUpsertedDailyStudyHistoryDoc({
      existingDoc: null,
      date: "2026-04-06",
      entry: {
        courseId: "TOEIC",
        dayNumber: 3,
        wordsLearned: 12,
        totalWords: 20,
        completedAt: "2026-04-06T09:00:00.000Z",
      },
      updatedAt: "2026-04-06T09:00:00.000Z",
    });

    expect(result).toEqual({
      date: "2026-04-06",
      updatedAt: "2026-04-06T09:00:00.000Z",
      vocabularyDays: [
        {
          courseId: "TOEIC",
          dayNumber: 3,
          wordsLearned: 12,
          totalWords: 20,
          completedAt: "2026-04-06T09:00:00.000Z",
        },
      ],
    });
  });

  it("upserts the same course/day without duplicating it", () => {
    const existingDoc: DailyStudyHistoryDoc = {
      date: "2026-04-06",
      updatedAt: "2026-04-06T09:00:00.000Z",
      vocabularyDays: [
        {
          courseId: "TOEIC",
          dayNumber: 3,
          wordsLearned: 12,
          totalWords: 20,
          completedAt: "2026-04-06T09:00:00.000Z",
        },
      ],
    };

    const result = buildUpsertedDailyStudyHistoryDoc({
      existingDoc,
      date: "2026-04-06",
      entry: {
        courseId: "TOEIC",
        dayNumber: 3,
        wordsLearned: 20,
        totalWords: 20,
        completedAt: "2026-04-06T10:00:00.000Z",
      },
      updatedAt: "2026-04-06T10:00:00.000Z",
    });

    expect(result.vocabularyDays).toHaveLength(1);
    expect(result.vocabularyDays[0]).toEqual({
      courseId: "TOEIC",
      dayNumber: 3,
      wordsLearned: 20,
      totalWords: 20,
      completedAt: "2026-04-06T10:00:00.000Z",
    });
  });

  it("sorts multiple entries by completion time descending", () => {
    const existingDoc: DailyStudyHistoryDoc = {
      date: "2026-04-06",
      updatedAt: "2026-04-06T09:00:00.000Z",
      vocabularyDays: [
        {
          courseId: "TOEIC",
          dayNumber: 3,
          wordsLearned: 12,
          totalWords: 20,
          completedAt: "2026-04-06T09:00:00.000Z",
        },
      ],
    };

    const result = buildUpsertedDailyStudyHistoryDoc({
      existingDoc,
      date: "2026-04-06",
      entry: {
        courseId: "TOEFL_IELTS",
        dayNumber: 1,
        wordsLearned: 15,
        totalWords: 18,
        completedAt: "2026-04-06T11:00:00.000Z",
      },
      updatedAt: "2026-04-06T11:00:00.000Z",
    });

    expect(result.vocabularyDays.map((entry) => `${entry.courseId}-${entry.dayNumber}`)).toEqual([
      "TOEFL_IELTS-1",
      "TOEIC-3",
    ]);
  });
});

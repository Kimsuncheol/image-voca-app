import type { CourseProgress } from "../src/stores/userStatsStore";
import { Platform } from "react-native";
import {
  buildLockScreenVocabularyPayload,
  createLockScreenVocabularyDeepLink,
  refreshLockScreenVocabularyPayload,
  resolveFirstIncompleteDay,
  resolveLockScreenVocabularyTarget,
  syncLockScreenVocabularyPayload,
  writeLockScreenVocabularyPayload,
} from "../src/services/lockScreenVocabulary";
import type { VocabularyCard } from "../src/types/vocabulary";

const mockSetPayload = jest.fn();
const mockGetTotalDaysForCourse = jest.fn();
const mockPrefetchVocabularyCards = jest.fn();
const mockGetLockScreenStudyPreferences = jest.fn();
const mockSyncAndroidLockScreenVocabularyNotification = jest.fn();

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

jest.mock("../modules/lock-screen-vocabulary", () => ({
  __esModule: true,
  default: {
    setPayload: (...args: unknown[]) => mockSetPayload(...args),
  },
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: (...args: unknown[]) => mockGetTotalDaysForCourse(...args),
  prefetchVocabularyCards: (...args: unknown[]) =>
    mockPrefetchVocabularyCards(...args),
}));

jest.mock("../src/services/lockScreenStudyPreferences", () => ({
  getLockScreenStudyPreferences: (...args: unknown[]) =>
    mockGetLockScreenStudyPreferences(...args),
}));

jest.mock("../src/utils/notifications", () => ({
  syncAndroidLockScreenVocabularyNotification: (...args: unknown[]) =>
    mockSyncAndroidLockScreenVocabularyNotification(...args),
}));

const vocabularyCard: VocabularyCard = {
  id: "word-1",
  word: "meticulous",
  meaning: "very careful",
  pronunciation: "muh-TIK-yuh-lus",
  example: "A meticulous plan",
  course: "TOEIC",
};

describe("lock screen vocabulary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    mockSetPayload.mockResolvedValue(undefined);
    mockSyncAndroidLockScreenVocabularyNotification.mockResolvedValue(false);
    mockGetTotalDaysForCourse.mockResolvedValue(3);
    mockPrefetchVocabularyCards.mockResolvedValue([vocabularyCard]);
    mockGetLockScreenStudyPreferences.mockResolvedValue({
      studyOnLockScreenEnabled: true,
    });
  });

  it("resolves the first incomplete day", () => {
    const progress: CourseProgress = {
      1: { completed: true },
      2: { completed: false },
    };

    expect(resolveFirstIncompleteDay(progress, 3)).toEqual({
      dayNumber: 2,
      isReviewFallback: false,
    });
  });

  it("falls back to the final day when every day is complete", () => {
    expect(
      resolveFirstIncompleteDay(
        {
          1: { completed: true },
          2: { completed: true },
        },
        2,
      ),
    ).toEqual({ dayNumber: 2, isReviewFallback: true });
  });

  it("resolves recent course target for the active learning language", () => {
    expect(
      resolveLockScreenVocabularyTarget({
        learningLanguage: "en",
        recentCourseByLanguage: { en: "TOEIC", ja: "JLPT_N5" },
        courseProgress: { 1: { completed: true } },
        totalDays: 4,
      }),
    ).toEqual({
      courseId: "TOEIC",
      dayNumber: 2,
      isReviewFallback: false,
    });
  });

  it("builds a privacy-preserving payload by default", () => {
    const payload = buildLockScreenVocabularyPayload({
      courseId: "TOEIC",
      dayNumber: 2,
      card: vocabularyCard,
      now: new Date("2026-06-21T00:00:00.000Z"),
    });

    expect(payload).toMatchObject({
      schemaVersion: 1,
      courseId: "TOEIC",
      dayNumber: 2,
      cardId: "word-1",
      word: "meticulous",
      pronunciation: "muh-TIK-yuh-lus",
      meaningHidden: true,
      updatedAt: "2026-06-21T00:00:00.000Z",
      deepLink: "imagevocaapp://course/TOEIC/vocabulary?day=2",
    });
    expect(payload?.meaning).toBeUndefined();
  });

  it("can include meaning when explicitly requested", () => {
    expect(
      buildLockScreenVocabularyPayload({
        courseId: "TOEIC",
        dayNumber: 2,
        card: vocabularyCard,
        showMeaning: true,
      })?.meaning,
    ).toBe("very careful");
  });

  it("encodes deep links for non-ascii course IDs", () => {
    expect(createLockScreenVocabularyDeepLink("수능", 5)).toBe(
      "imagevocaapp://course/%EC%88%98%EB%8A%A5/vocabulary?day=5",
    );
  });

  it("writes payload JSON to the iOS bridge", async () => {
    const result = await writeLockScreenVocabularyPayload(
      buildLockScreenVocabularyPayload({
        courseId: "TOEIC",
        dayNumber: 1,
        card: vocabularyCard,
      }),
    );

    expect(result).toBe(true);
    expect(mockSetPayload).toHaveBeenCalledWith(
      "group.com.benjaminkim96.imagevocaapp.lockscreen-vocabulary",
      "lockScreenVocabularyPayload",
      expect.stringContaining('"word":"meticulous"'),
    );
  });

  it("refreshes from recent course, next day, and cached vocabulary", async () => {
    const payload = await refreshLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockGetTotalDaysForCourse).toHaveBeenCalledWith("TOEIC");
    expect(mockPrefetchVocabularyCards).toHaveBeenCalledWith(
      "TOEIC",
      2,
      expect.objectContaining({ preferCache: true }),
    );
    expect(payload?.dayNumber).toBe(2);
    expect(mockSetPayload).toHaveBeenCalled();
  });

  it("clears the widget payload when there is no recent course", async () => {
    await refreshLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: {},
    });

    expect(mockSetPayload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      null,
    );
  });

  it("clears and skips vocabulary fetches when lock screen study is disabled", async () => {
    mockGetLockScreenStudyPreferences.mockResolvedValueOnce({
      studyOnLockScreenEnabled: false,
    });

    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockSetPayload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      null,
    );
    expect(mockGetTotalDaysForCourse).not.toHaveBeenCalled();
    expect(mockPrefetchVocabularyCards).not.toHaveBeenCalled();
  });

  it("refreshes the payload when lock screen study is enabled", async () => {
    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockGetTotalDaysForCourse).toHaveBeenCalledWith("TOEIC");
    expect(mockPrefetchVocabularyCards).toHaveBeenCalledWith(
      "TOEIC",
      2,
      expect.objectContaining({ preferCache: true }),
    );
    expect(mockSetPayload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringContaining('"word":"meticulous"'),
    );
  });

  it("clears the payload after lock screen study is disabled", async () => {
    mockGetLockScreenStudyPreferences
      .mockResolvedValueOnce({ studyOnLockScreenEnabled: true })
      .mockResolvedValueOnce({ studyOnLockScreenEnabled: false });

    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });
    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockSetPayload).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.any(String),
      null,
    );
  });

  it("schedules Android lock screen vocabulary notifications", async () => {
    Platform.OS = "android";
    mockSyncAndroidLockScreenVocabularyNotification.mockResolvedValueOnce(true);

    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockSetPayload).not.toHaveBeenCalled();
    expect(mockSyncAndroidLockScreenVocabularyNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "TOEIC",
        dayNumber: 2,
        word: "meticulous",
        meaning: undefined,
      }),
    );
  });

  it("cancels Android lock screen vocabulary notifications when disabled", async () => {
    Platform.OS = "android";
    mockGetLockScreenStudyPreferences.mockResolvedValueOnce({
      studyOnLockScreenEnabled: false,
    });
    mockSyncAndroidLockScreenVocabularyNotification.mockResolvedValueOnce(true);

    await syncLockScreenVocabularyPayload({
      learningLanguage: "en",
      recentCourseByLanguage: { en: "TOEIC" },
      courseProgressByCourse: { TOEIC: { 1: { completed: true } } },
    });

    expect(mockSetPayload).not.toHaveBeenCalled();
    expect(mockSyncAndroidLockScreenVocabularyNotification).toHaveBeenCalledWith(
      null,
    );
    expect(mockGetTotalDaysForCourse).not.toHaveBeenCalled();
    expect(mockPrefetchVocabularyCards).not.toHaveBeenCalled();
  });
});

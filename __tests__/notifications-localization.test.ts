import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-localization", () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: "en" })),
  getLocales: jest.fn(() => [{ languageTag: "en", languageCode: "en" }]),
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: jest.fn(),
  prefetchVocabularyCards: jest.fn(),
}));

import { setLanguage } from "../src/i18n";
import {
  buildKanjiPopWordNotificationContent,
  buildKanjiPopWordNotificationData,
  buildPopWordNotificationData,
  buildPopWordNotificationContent,
  getMuteAtNightPreference,
  schedulePopWordNotifications,
  setMuteAtNightPreference,
} from "../src/utils/notifications";
import {
  getTotalDaysForCourse,
  prefetchVocabularyCards,
} from "../src/services/vocabularyPrefetch";

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => "notif-id"),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  AndroidImportance: {
    DEFAULT: "DEFAULT",
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 1,
  },
}));

describe("notification localization", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await setLanguage("en");
  });

  it("builds a Korean collocation notification body from localized fields", async () => {
    await setLanguage("ko");

    const content = await buildPopWordNotificationContent({
      course: "TOEIC",
      word: "abandon",
      meaning: "leave behind",
      example: "They abandoned the plan.",
      localized: {
        en: { meaning: "leave behind" },
        ko: { meaning: "버리다" },
      },
    });

    expect(content).toEqual({
      title: "오늘의 연어",
      body: "abandon - 버리다\n\n예문: They abandoned the plan.",
    });
  });

  it("falls back Japanese scheduling content to English localized fields", async () => {
    await setLanguage("ja");

    const content = await buildPopWordNotificationContent({
      course: "COLLOCATION",
      word: "make a decision",
      meaning: "to decide",
      pronunciation: "결정을 내리다",
      localized: {
        en: {
          meaning: "to decide",
          pronunciation: "to decide",
        },
        ko: {
          meaning: "결정을 내리다",
          pronunciation: "결정을 내리다",
        },
      },
    });

    expect(content).toEqual({
      title: "今日のコロケーション",
      body: "make a decision - to decide\n\n発音: to decide",
    });
  });

  it("includes CSAT_IDIOMS and EXTREMELY_ADVANCED when scheduling pop-word notifications", async () => {
    (getTotalDaysForCourse as jest.Mock).mockResolvedValue(1);
    (prefetchVocabularyCards as jest.Mock).mockResolvedValue([
      {
        word: "break the ice",
        meaning: "start a conversation",
        example: "He told a joke to break the ice.",
        course: "CSAT_IDIOMS",
      },
    ]);

    await schedulePopWordNotifications("user-1", 1);

    expect(getTotalDaysForCourse).toHaveBeenCalledWith("CSAT_IDIOMS");
    expect(getTotalDaysForCourse).toHaveBeenCalledWith("EXTREMELY_ADVANCED");
    expect(prefetchVocabularyCards).toHaveBeenCalledWith("CSAT_IDIOMS", 1);
    expect(prefetchVocabularyCards).toHaveBeenCalledWith(
      "EXTREMELY_ADVANCED",
      1,
    );
  });

  it("schedules non-kanji pop-word notifications as collocation cards", async () => {
    (getTotalDaysForCourse as jest.Mock).mockResolvedValue(1);
    (prefetchVocabularyCards as jest.Mock).mockResolvedValue([
      {
        word: "abandon",
        meaning: "leave behind",
        example: "They abandoned the plan.",
        course: "TOEIC",
      },
    ]);

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");
    (scheduleNotificationAsync as jest.Mock).mockClear();

    await schedulePopWordNotifications("user-1", 1);

    expect(
      (scheduleNotificationAsync as jest.Mock).mock.calls[0][0].content.data,
    ).toEqual(
      expect.objectContaining({
        cardKind: "collocation",
        course: "TOEIC",
      }),
    );
  });

  it("does not schedule collocation notifications during night hours (22:00–07:59)", async () => {
    // Fake system time to 23:00 so the first candidate hour is midnight
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T23:00:00"));

    (getTotalDaysForCourse as jest.Mock).mockResolvedValue(1);
    (prefetchVocabularyCards as jest.Mock).mockResolvedValue([
      { word: "test", meaning: "test meaning", course: "TOEIC" },
    ]);

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");
    (scheduleNotificationAsync as jest.Mock).mockClear();

    await schedulePopWordNotifications("user-1", 1);

    const triggeredDates: Date[] = (scheduleNotificationAsync as jest.Mock).mock.calls.map(
      ([{ trigger }]: [{ trigger: { date: Date } }]) => trigger.date,
    );

    for (const date of triggeredDates) {
      const hour = date.getHours();
      expect(hour).toBeGreaterThanOrEqual(8);
      expect(hour).toBeLessThan(22);
    }

    jest.useRealTimers();
  });

  it("defaults mute at night preference to enabled", async () => {
    expect(await getMuteAtNightPreference()).toBe(true);
  });

  it("allows collocation notifications during night hours when mute at night is disabled", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T23:00:00"));

    await setMuteAtNightPreference(false);
    (getTotalDaysForCourse as jest.Mock).mockResolvedValue(1);
    (prefetchVocabularyCards as jest.Mock).mockResolvedValue([
      { word: "test", meaning: "test meaning", course: "TOEIC" },
    ]);

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");
    (scheduleNotificationAsync as jest.Mock).mockClear();

    await schedulePopWordNotifications("user-1", 1);

    const triggeredDates: Date[] = (scheduleNotificationAsync as jest.Mock).mock.calls.map(
      ([{ trigger }]: [{ trigger: { date: Date } }]) => trigger.date,
    );

    expect(triggeredDates.some((date) => isNightHour(date.getHours()))).toBe(
      true,
    );

    jest.useRealTimers();
  });

  it("retargets pop-word payload data to collocation notifications", () => {
    expect(
      buildPopWordNotificationData({
        course: "JLPT_N5",
        word: "雨戸",
        meaning: "storm shutter",
        example: "雨(あま)戸(ど)を閉(し)める。",
        exampleHurigana: "あまどをしめる。",
      }),
    ).toEqual(
      expect.objectContaining({
        cardKind: "collocation",
        course: "JLPT_N5",
        example: "雨(あま)戸(ど)を閉(し)める。",
        exampleHurigana: "あまどをしめる。",
      }),
    );
  });

  it("builds Korean Kanji notification content from Korean meaning and reading fields", async () => {
    await setLanguage("ko");

    const content = await buildKanjiPopWordNotificationContent({
      id: "kanji-1",
      kanji: "語",
      meaning: ["word"],
      meaningKorean: ["단어"],
      meaningKoreanRomanize: ["dan-eo"],
      meaningExample: [],
      meaningExampleHurigana: [],
      meaningEnglishTranslation: [],
      meaningKoreanTranslation: [],
      reading: ["ご"],
      readingKorean: ["고"],
      readingKoreanRomanize: ["go"],
      readingExample: [],
      readingExampleHurigana: [],
      readingEnglishTranslation: [],
      readingKoreanTranslation: [],
      example: [],
      exampleEnglishTranslation: [],
      exampleKoreanTranslation: [],
      exampleHurigana: [],
    });

    expect(content).toEqual({
      title: "오늘의 한자",
      body: "語　단어\n고",
    });
  });

  it("preserves localized Kanji fields in notification payload data", () => {
    const payload = buildKanjiPopWordNotificationData({
      id: "kanji-1",
      kanji: "語",
      meaning: ["word"],
      meaningKorean: ["단어"],
      meaningKoreanRomanize: ["dan-eo"],
      meaningExample: [],
      meaningExampleHurigana: [],
      meaningEnglishTranslation: [],
      meaningKoreanTranslation: [],
      reading: ["ご"],
      readingKorean: ["고"],
      readingKoreanRomanize: ["go"],
      readingExample: [],
      readingExampleHurigana: [],
      readingEnglishTranslation: [],
      readingKoreanTranslation: [],
      example: [],
      exampleEnglishTranslation: [],
      exampleKoreanTranslation: [],
      exampleHurigana: [],
    });

    expect(payload).toEqual(
      expect.objectContaining({
        meaningKorean: JSON.stringify(["단어"]),
        meaningKoreanRomanize: JSON.stringify(["dan-eo"]),
        readingKorean: JSON.stringify(["고"]),
        readingKoreanRomanize: JSON.stringify(["go"]),
      }),
    );
  });
});

const isNightHour = (hour: number) => hour >= 22 || hour < 8;

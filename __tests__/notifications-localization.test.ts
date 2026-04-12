import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-localization", () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: "en" })),
  getLocales: jest.fn(() => [{ languageTag: "en", languageCode: "en" }]),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  getTotalDaysForCourse: jest.fn(),
  prefetchVocabularyCards: jest.fn(),
}));

jest.mock("../src/services/vocaService", () => ({
  vocaService: {
    getUserWords: jest.fn(),
  },
}));

import { setLanguage } from "../src/i18n";
import {
  buildPopWordNotificationData,
  buildPopWordNotificationContent,
  schedulePopWordNotifications,
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

  it("builds a Korean word notification body from localized fields", async () => {
    await setLanguage("ko");

    const content = await buildPopWordNotificationContent({
      word: "abandon",
      meaning: "leave behind",
      example: "They abandoned the plan.",
      localized: {
        en: { meaning: "leave behind" },
        ko: { meaning: "버리다" },
      },
    });

    expect(content).toEqual({
      title: "오늘의 단어",
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

  it("preserves exampleHurigana in notification payload data", () => {
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
        course: "JLPT_N5",
        example: "雨(あま)戸(ど)を閉(し)める。",
        exampleHurigana: "あまどをしめる。",
      }),
    );
  });
});

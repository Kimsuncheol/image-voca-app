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
import { buildPopWordNotificationContent } from "../src/utils/notifications";

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
});

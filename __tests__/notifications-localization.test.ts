import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

jest.mock("expo-localization", () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: "en" })),
  getLocales: jest.fn(() => [{ languageTag: "en", languageCode: "en" }]),
}));

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
  AndroidNotificationVisibility: {
    PUBLIC: "PUBLIC",
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 1,
  },
}));

import { setLanguage } from "../src/i18n";
import {
  configureNotifications,
  cancelLockScreenVocabularyNotifications,
  getStudyReminderEnabledPreference,
  LOCK_SCREEN_VOCABULARY_ANDROID_CHANNEL_ID,
  LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE,
  scheduleDailyNotifications,
  scheduleLockScreenVocabularyNotification,
  scheduleStudyReminderNotifications,
  setStudyReminderEnabledPreference,
  syncAndroidLockScreenVocabularyNotification,
} from "../src/utils/notifications";

describe("notification localization", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    await AsyncStorage.clear();
    await setLanguage("en");
  });

  it("schedules localized Korean study reminder notifications", async () => {
    await setLanguage("ko");

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");

    await scheduleStudyReminderNotifications(1);

    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "학습 알림",
          body: "오늘도 어휘 학습 습관을 만들어보세요! 앱을 열고 단어나 연어를 공부해보세요.",
          data: { type: "study_reminder" },
        }),
      }),
    );
  });

  it("schedules localized Japanese study reminder notifications", async () => {
    await setLanguage("ja");

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");

    await scheduleStudyReminderNotifications(1);

    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "学習リマインダー",
          body: "語彙習慣を作りましょう！アプリを開いて、単語やコロケーションを学習してください。",
          data: { type: "study_reminder" },
        }),
      }),
    );
  });

  it("defaults study reminder preference to enabled", async () => {
    expect(await getStudyReminderEnabledPreference()).toBe(true);
  });

  it("does not schedule daily notifications when study reminders are disabled", async () => {
    await setStudyReminderEnabledPreference(false);

    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");

    await scheduleDailyNotifications();

    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("configures Android local reminders in Expo Go when the notifications module is available", async () => {
    Platform.OS = "android";
    const {
      getPermissionsAsync,
      setNotificationChannelAsync,
      setNotificationHandler,
    } = jest.requireMock("expo-notifications");
    (getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      canAskAgain: false,
      ios: { status: 0 },
    });

    await configureNotifications();

    expect(setNotificationHandler).toHaveBeenCalled();
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      "study-reminders",
      expect.objectContaining({
        name: "Study Reminders",
      }),
    );
  });

  it("schedules Android lock screen vocabulary notifications without meanings", async () => {
    Platform.OS = "android";
    const {
      scheduleNotificationAsync,
      setNotificationChannelAsync,
    } = jest.requireMock("expo-notifications");

    await scheduleLockScreenVocabularyNotification({
      schemaVersion: 1,
      courseId: "TOEIC",
      dayNumber: 2,
      cardId: "word-1",
      word: "meticulous",
      pronunciation: "muh-TIK-yuh-lus",
      meaning: "very careful",
      meaningHidden: true,
      updatedAt: "2026-06-21T00:00:00.000Z",
      deepLink: "imagevocaapp://course/TOEIC/vocabulary?day=2",
    });

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      LOCK_SCREEN_VOCABULARY_ANDROID_CHANNEL_ID,
      expect.objectContaining({
        importance: "DEFAULT",
        lockscreenVisibility: "PUBLIC",
      }),
    );
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Today's word",
          body: "meticulous · muh-TIK-yuh-lus",
          data: {
            type: LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE,
            courseId: "TOEIC",
            dayNumber: 2,
            deepLink: "imagevocaapp://course/TOEIC/vocabulary?day=2",
          },
        }),
        trigger: expect.objectContaining({
          channelId: LOCK_SCREEN_VOCABULARY_ANDROID_CHANNEL_ID,
        }),
      }),
    );
    expect(
      scheduleNotificationAsync.mock.calls[0][0].content.body,
    ).not.toContain("very careful");
  });

  it("cancels stored Android lock screen vocabulary notifications", async () => {
    Platform.OS = "android";
    const {
      cancelScheduledNotificationAsync,
    } = jest.requireMock("expo-notifications");

    await scheduleLockScreenVocabularyNotification({
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
    jest.clearAllMocks();

    await cancelLockScreenVocabularyNotifications();

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-id");
  });

  it("does not schedule Android lock screen vocabulary notifications for null or unsupported platforms", async () => {
    const { scheduleNotificationAsync } = jest.requireMock("expo-notifications");

    Platform.OS = "android";
    await syncAndroidLockScreenVocabularyNotification(null);
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();

    Platform.OS = "ios";
    await syncAndroidLockScreenVocabularyNotification({
      schemaVersion: 1,
      courseId: "TOEIC",
      dayNumber: 2,
      cardId: "word-1",
      word: "meticulous",
      meaningHidden: true,
      updatedAt: "2026-06-21T00:00:00.000Z",
      deepLink: "imagevocaapp://course/TOEIC/vocabulary?day=2",
    });

    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

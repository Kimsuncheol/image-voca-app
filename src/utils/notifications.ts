import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as NotificationsType from "expo-notifications";
import { collection, getDocs } from "firebase/firestore";
import { Platform } from "react-native";
import i18n, { getCurrentLanguage } from "../i18n";
import { db } from "../services/firebase";
import {
    getTotalDaysForCourse,
    prefetchVocabularyCards,
} from "../services/vocabularyPrefetch";
import { vocaService } from "../services/vocaService";
import type { NotificationCardPayload } from "../types/notificationCard";
import { CourseType } from "../types/vocabulary";
import { resolveVocabularyContent } from "./localizedVocabulary";

type NotificationsModule = typeof import("expo-notifications");
type NotificationPermissions = NotificationsType.NotificationPermissionsStatus;

const POP_WORD_NOTIFICATION_IDS_KEY = "voca_pop_word_notification_ids";
const STUDY_REMINDER_NOTIFICATION_IDS_KEY =
  "voca_study_reminder_notification_ids";
const LAST_STUDY_DATE_KEY = "voca_last_study_date";
const NOTIFICATIONS_ENABLED_KEY = "voca_notifications_enabled";
const POP_WORD_ENABLED_KEY = "voca_pop_word_enabled";
const STUDY_REMINDER_ENABLED_KEY = "voca_study_reminder_enabled";

const DEFAULT_REMINDER_HOUR = 19;
const DEFAULT_REMINDER_MINUTE = 0;
const SCHEDULE_WINDOW_DAYS = 7;
const HOURLY_NOTIFICATION_COUNT = 55;
const ANDROID_CHANNEL_ID = "voca-daily";

let cachedNotifications: NotificationsModule | null = null;
let handlerConfigured = false;

const getNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotifications !== null) return cachedNotifications;
  // Note: While remote push notifications are unsupported in Expo Go on Android (SDK 53+),
  // local notifications (which we use for Study Reminder and Word of the Day) still work perfectly.
  try {
    cachedNotifications = require("expo-notifications");
    return cachedNotifications;
  } catch {
    cachedNotifications = null;
    return null;
  }
};

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

const isSameOrAfterNow = (date: Date) => date.getTime() > Date.now();

const getScheduleDates = (
  hour: number,
  minute: number,
  days: number,
  startFromTomorrow: boolean,
) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(hour, minute, 0, 0);

  if (startFromTomorrow || !isSameOrAfterNow(start)) {
    start.setDate(start.getDate() + 1);
  }

  const dates: Date[] = [];
  for (let i = 0; i < days; i += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    dates.push(next);
  }
  return dates;
};

const getHourlyScheduleDates = (hours: number) => {
  const dates: Date[] = [];
  const now = new Date();
  const start = new Date(now);
  start.setHours(start.getHours() + 1, 0, 0, 0);

  for (let i = 0; i < hours; i++) {
    const next = new Date(start);
    next.setHours(start.getHours() + i);
    dates.push(next);
  }
  return dates;
};

const buildDateTrigger = (date: Date): NotificationsType.DateTriggerInput => {
  if (Platform.OS === "android") {
    return {
      type: "date" as NotificationsType.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: ANDROID_CHANNEL_ID,
    };
  }
  // iOS also uses DateTriggerInput, just without channelId
  return {
    type: "date" as NotificationsType.SchedulableTriggerInputTypes.DATE,
    date,
  };
};

const getStoredIds = async (key: string): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to parse notification ids", error);
    return [];
  }
};

const storeIds = async (key: string, ids: string[]) => {
  if (ids.length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(ids));
};

const cancelStoredNotifications = async (key: string) => {
  const ids = await getStoredIds(key);
  if (ids.length === 0) {
    await AsyncStorage.removeItem(key);
    return;
  }
  const Notifications = getNotificationsModule();
  if (Notifications) {
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
  }
  await AsyncStorage.removeItem(key);
};

type NotificationCardSelection = {
  id?: string;
  word?: string;
  meaning?: string;
  pronunciation?: string;
  pronunciationRoman?: string;
  example?: string;
  translation?: string;
  imageUrl?: string;
  localized?: NotificationCardPayload["localized"];
  course?: CourseType | string;
};

const buildPopWordNotificationData = (
  selection: NotificationCardSelection,
): NotificationCardPayload => {
  const isCollocation = selection.course === "COLLOCATION";

  return {
    type: "pop_word",
    cardKind: isCollocation ? "collocation" : "word",
    course: selection.course ?? "WORD_BANK",
    id: selection.id,
    word: selection.word ?? "",
    meaning: selection.meaning ?? "",
    pronunciation: selection.pronunciation ?? "",
    pronunciationRoman: selection.pronunciationRoman ?? "",
    example: selection.example ?? "",
    translation: selection.translation ?? "",
    imageUrl: selection.imageUrl ?? "",
    localized: selection.localized,
  };
};

export const buildPopWordNotificationContent = async (
  selection: NotificationCardSelection,
) => {
  const language = await getCurrentLanguage();
  const t = i18n.getFixedT(language);
  const resolved = resolveVocabularyContent(
    {
      word: selection.word ?? "",
      meaning: selection.meaning ?? "",
      translation: selection.translation,
      pronunciation: selection.pronunciation,
      pronunciationRoman: selection.pronunciationRoman,
      example: selection.example,
      imageUrl: selection.imageUrl,
      localized: selection.localized,
    },
    language,
  );

  let title = t("notifications.word.title", { defaultValue: "Word of the Day" });
  let body = `${resolved.word} - ${resolved.meaning}`;

  if (selection.course === "COLLOCATION") {
    title = t("notifications.collocation.title", {
      defaultValue: "Collocation of the Day",
    });
    if (resolved.localizedPronunciation) {
      body += `\n\n${t("notifications.labels.pronunciation", {
        defaultValue: "Pronunciation",
      })}: ${resolved.localizedPronunciation}`;
    } else if (resolved.example) {
      body += `\n\n${t("notifications.labels.example", {
        defaultValue: "Example",
      })}: ${resolved.example}`;
    }
  } else if (resolved.example) {
    body += `\n\n${t("notifications.labels.example", {
      defaultValue: "Example",
    })}: ${resolved.example}`;
  }

  return { title, body };
};

const fetchSavedWords = async (userId: string) => {
  const words: { word: string; meaning: string }[] = [];
  try {
    const snapshot = await getDocs(
      collection(db, "vocabank", userId, "course"),
    );
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const savedWords = Array.isArray(data.words) ? data.words : [];
      savedWords.forEach((saved: any) => {
        if (!saved?.word) return;
        words.push({
          word: saved.word,
          meaning: saved.meaning || saved.definition || "",
        });
      });
    });
  } catch (error) {
    console.warn("Failed to load saved word bank", error);
  }

  if (words.length > 0) return words;

  try {
    const fallback = await vocaService.getUserWords(userId);
    fallback.forEach((saved: any) => {
      if (!saved?.word) return;
      words.push({
        word: saved.word,
        meaning: saved.definition || saved.meaning || "",
      });
    });
  } catch (error) {
    console.warn("Failed to load fallback vocabulary", error);
  }

  return words;
};

export const getNotificationPermissions =
  async (): Promise<NotificationPermissions | null> => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return null;
    return Notifications.getPermissionsAsync();
  };

export const isPermissionGranted = (
  permissions: NotificationPermissions | null,
) => {
  if (!permissions) return false;
  if (permissions.granted) return true;
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;
  return (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const configureNotifications =
  async (): Promise<NotificationPermissions | null> => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return null;

    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      handlerConfigured = true;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Voca Daily",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A90E2",
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (isPermissionGranted(current)) return current;
    return Notifications.requestPermissionsAsync();
  };

export const getNotificationsEnabledPreference = async () => {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (value === null) return true;
  return value === "true";
};

export const setNotificationsEnabledPreference = async (enabled: boolean) => {
  await AsyncStorage.setItem(
    NOTIFICATIONS_ENABLED_KEY,
    enabled ? "true" : "false",
  );
};

export const getPopWordEnabledPreference = async () => {
  const value = await AsyncStorage.getItem(POP_WORD_ENABLED_KEY);
  if (value === null) return true;
  return value === "true";
};

export const setPopWordEnabledPreference = async (enabled: boolean) => {
  await AsyncStorage.setItem(POP_WORD_ENABLED_KEY, enabled ? "true" : "false");
};

export const getStudyReminderEnabledPreference = async () => {
  const value = await AsyncStorage.getItem(STUDY_REMINDER_ENABLED_KEY);
  if (value === null) return true;
  return value === "true";
};

export const setStudyReminderEnabledPreference = async (enabled: boolean) => {
  await AsyncStorage.setItem(
    STUDY_REMINDER_ENABLED_KEY,
    enabled ? "true" : "false",
  );
};

export const cancelTodayStudyReminder = async (): Promise<void> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  const storedIds = await getStoredIds(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
  if (storedIds.length === 0) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const todayKey = formatDateKey(new Date());

  const todayIds = storedIds.filter((id) => {
    const notif = scheduled.find((n) => n.identifier === id);
    if (!notif) return false;
    const trigger = notif.trigger as any;
    const triggerDate: Date | null = trigger?.date
      ? new Date(trigger.date)
      : trigger?.value
        ? new Date(trigger.value)
        : null;
    return triggerDate ? formatDateKey(triggerDate) === todayKey : false;
  });

  if (todayIds.length === 0) return;

  await Promise.all(
    todayIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );

  const remaining = storedIds.filter((id) => !todayIds.includes(id));
  await storeIds(STUDY_REMINDER_NOTIFICATION_IDS_KEY, remaining);
};

export const markStudyDate = async (date = new Date()) => {
  await AsyncStorage.setItem(LAST_STUDY_DATE_KEY, formatDateKey(date));
  cancelTodayStudyReminder().catch(() => {});
};

export const getLastStudyDate = async () => {
  return AsyncStorage.getItem(LAST_STUDY_DATE_KEY);
};

export const cancelAllScheduledNotifications = async () => {
  await cancelStoredNotifications(POP_WORD_NOTIFICATION_IDS_KEY);
  await cancelStoredNotifications(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
};

export const schedulePopWordNotifications = async (
  userId: string,
  days: number = SCHEDULE_WINDOW_DAYS,
) => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await cancelStoredNotifications(POP_WORD_NOTIFICATION_IDS_KEY);

  const COURSES: CourseType[] = [
    "수능",
    "TOEIC",
    "TOEFL_IELTS",
    "COLLOCATION",
  ];
  const allCards: any[] = [];

  for (const course of COURSES) {
    try {
      const totalDays = await getTotalDaysForCourse(course);
      if (totalDays > 0) {
        const daysToFetch = Math.min(totalDays, 2);
        const selectedDays = new Set<number>();
        while (selectedDays.size < daysToFetch) {
          selectedDays.add(Math.floor(Math.random() * totalDays) + 1);
        }
        for (const day of selectedDays) {
          const cards = await prefetchVocabularyCards(course, day);
          allCards.push(...cards);
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch course ${course} for pop words`, err);
    }
  }

  if (allCards.length === 0) {
    const fallbackWords = await fetchSavedWords(userId);
    allCards.push(...fallbackWords);
  }

  if (allCards.length === 0) return;

  const dates = getHourlyScheduleDates(HOURLY_NOTIFICATION_COUNT);
  const scheduledIds: string[] = [];
  const shuffledCards = allCards.sort(() => 0.5 - Math.random());

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const selection = shuffledCards[i % shuffledCards.length];
    const { title, body } = await buildPopWordNotificationContent(selection);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...buildPopWordNotificationData(selection) },
      },
      trigger: buildDateTrigger(date),
    });
    scheduledIds.push(id);
  }

  await storeIds(POP_WORD_NOTIFICATION_IDS_KEY, scheduledIds);
};

export const scheduleStudyReminderNotifications = async (
  days: number = SCHEDULE_WINDOW_DAYS,
) => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  await cancelStoredNotifications(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
  const lastStudyDate = await getLastStudyDate();
  const today = formatDateKey(new Date());
  const dates = getScheduleDates(
    DEFAULT_REMINDER_HOUR,
    DEFAULT_REMINDER_MINUTE,
    days,
    lastStudyDate === today,
  );

  const scheduledIds: string[] = [];

  for (const date of dates) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Study Reminder",
        body: "Time to build your vocabulary habit! Open the app and study your words or collocations today.",
        data: { type: "study_reminder" },
      },
      trigger: buildDateTrigger(date),
    });
    scheduledIds.push(id);
  }

  await storeIds(STUDY_REMINDER_NOTIFICATION_IDS_KEY, scheduledIds);
};

export const scheduleDailyNotifications = async (userId?: string) => {
  const [studyEnabled, popEnabled] = await Promise.all([
    getStudyReminderEnabledPreference(),
    getPopWordEnabledPreference(),
  ]);

  if (studyEnabled) {
    await scheduleStudyReminderNotifications();
  } else {
    await cancelStoredNotifications(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
  }

  if (userId && popEnabled) {
    await schedulePopWordNotifications(userId);
    return;
  }
  await cancelStoredNotifications(POP_WORD_NOTIFICATION_IDS_KEY);
};

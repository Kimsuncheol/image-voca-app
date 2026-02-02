import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as NotificationsType from "expo-notifications";
import { collection, getDocs } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../services/firebase";
import { vocaService } from "../services/vocaService";

type NotificationsModule = typeof import("expo-notifications");
type NotificationPermissions = NotificationsType.NotificationPermissionsStatus;

const POP_WORD_NOTIFICATION_IDS_KEY = "voca_pop_word_notification_ids";
const STUDY_REMINDER_NOTIFICATION_IDS_KEY =
  "voca_study_reminder_notification_ids";
const LAST_STUDY_DATE_KEY = "voca_last_study_date";
const NOTIFICATIONS_ENABLED_KEY = "voca_notifications_enabled";
const POP_WORD_ENABLED_KEY = "voca_pop_word_enabled";
const STUDY_REMINDER_ENABLED_KEY = "voca_study_reminder_enabled";

const DEFAULT_POP_WORD_HOUR = 10;
const DEFAULT_POP_WORD_MINUTE = 0;
const DEFAULT_REMINDER_HOUR = 20;
const DEFAULT_REMINDER_MINUTE = 0;
const SCHEDULE_WINDOW_DAYS = 7;
const ANDROID_CHANNEL_ID = "voca-daily";

let cachedNotifications: NotificationsModule | null = null;
let handlerConfigured = false;

const getNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotifications !== null) return cachedNotifications;
  try {
    // Attempt to require expo-notifications
    // This may fail in Expo Go SDK 53+ or if the module is not installed
    cachedNotifications = require("expo-notifications");
    return cachedNotifications;
  } catch {
    // Silently handle the error - notifications are unavailable
    // This is expected in Expo Go SDK 53+ and development builds without the package
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

const buildDateTrigger = (
  date: Date,
): NotificationsType.DateTriggerInput => {
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

export const markStudyDate = async (date = new Date()) => {
  await AsyncStorage.setItem(LAST_STUDY_DATE_KEY, formatDateKey(date));
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
  const words = await fetchSavedWords(userId);
  if (words.length === 0) return;

  const dates = getScheduleDates(
    DEFAULT_POP_WORD_HOUR,
    DEFAULT_POP_WORD_MINUTE,
    days,
    false,
  );

  const scheduledIds: string[] = [];

  for (const date of dates) {
    const selection = words[Math.floor(Math.random() * words.length)];
    const meaning = selection.meaning || "Open the app to see the meaning.";
    const body = `Word of the Day: ${selection.word} - ${meaning}`;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Word of the Day",
        body,
        data: { type: "pop_word", word: selection.word },
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
        body: "You haven't studied your words today! Open the app to review.",
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

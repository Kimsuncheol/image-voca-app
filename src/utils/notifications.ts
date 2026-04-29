import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as NotificationsType from "expo-notifications";
import { Platform } from "react-native";
import i18n, { getCurrentLanguage } from "../i18n";

type NotificationsModule = typeof import("expo-notifications");
type NotificationPermissions = NotificationsType.NotificationPermissionsStatus;

const STUDY_REMINDER_NOTIFICATION_IDS_KEY =
  "voca_study_reminder_notification_ids";
const LAST_STUDY_DATE_KEY = "voca_last_study_date";
const STUDY_REMINDER_ENABLED_KEY = "voca_study_reminder_enabled";

const DEFAULT_REMINDER_HOUR = 19;
const DEFAULT_REMINDER_MINUTE = 0;
const SCHEDULE_WINDOW_DAYS = 7;
const ANDROID_CHANNEL_ID = "study-reminders";

let cachedNotifications: NotificationsModule | null | undefined;
let handlerConfigured = false;

const getNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotifications !== undefined) return cachedNotifications;

  try {
    cachedNotifications = require("expo-notifications");
    return cachedNotifications ?? null;
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
        name: "Study Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A90E2",
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (isPermissionGranted(current)) return current;
    return Notifications.requestPermissionsAsync();
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
  await cancelStoredNotifications(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
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

  const language = await getCurrentLanguage();
  const t = i18n.getFixedT(language);
  const reminderTitle = t("notifications.reminder.title", {
    defaultValue: "Study Reminder",
  });
  const reminderBody = t("notifications.reminder.body", {
    defaultValue:
      "Time to build your vocabulary habit! Open the app and study your words or collocations today.",
  });

  const scheduledIds: string[] = [];

  for (const date of dates) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminderTitle,
        body: reminderBody,
        data: { type: "study_reminder" },
      },
      trigger: buildDateTrigger(date),
    });
    scheduledIds.push(id);
  }

  await storeIds(STUDY_REMINDER_NOTIFICATION_IDS_KEY, scheduledIds);
};

export const scheduleDailyNotifications = async () => {
  const studyEnabled = await getStudyReminderEnabledPreference();

  if (studyEnabled) {
    await scheduleStudyReminderNotifications();
  } else {
    await cancelStoredNotifications(STUDY_REMINDER_NOTIFICATION_IDS_KEY);
  }
};

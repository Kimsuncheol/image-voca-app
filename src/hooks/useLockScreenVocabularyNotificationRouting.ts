import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE } from "../utils/notifications";

type NotificationsModule = typeof import("expo-notifications");

interface NotificationResponseLike {
  actionIdentifier?: string;
  notification?: {
    request?: {
      identifier?: string;
      content?: {
        data?: Record<string, unknown>;
      };
    };
  };
}

const loadNotificationsModule = (): NotificationsModule | null => {
  try {
    return require("expo-notifications") as NotificationsModule;
  } catch {
    return null;
  }
};

export const getLockScreenVocabularyRouteFromNotificationResponse = (
  response: NotificationResponseLike | null | undefined,
) => {
  const data = response?.notification?.request?.content?.data;
  if (data?.type !== LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE) return null;

  const courseId = typeof data.courseId === "string" ? data.courseId : null;
  const rawDayNumber = data.dayNumber;
  const dayNumber =
    typeof rawDayNumber === "number"
      ? rawDayNumber
      : typeof rawDayNumber === "string"
        ? Number.parseInt(rawDayNumber, 10)
        : NaN;

  if (!courseId || !Number.isFinite(dayNumber) || dayNumber < 1) {
    return null;
  }

  return {
    pathname: "/course/[courseId]/vocabulary" as const,
    params: {
      courseId,
      day: String(Math.floor(dayNumber)),
    },
  };
};

export const useLockScreenVocabularyNotificationRouting = () => {
  const router = useRouter();
  const handledNotificationIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const Notifications = loadNotificationsModule();
    if (!Notifications) return;

    const handleResponse = (response: NotificationResponseLike) => {
      const route =
        getLockScreenVocabularyRouteFromNotificationResponse(response);
      if (!route) return;

      const notificationId = response.notification?.request?.identifier;
      if (notificationId) {
        if (handledNotificationIdsRef.current.has(notificationId)) return;
        handledNotificationIdsRef.current.add(notificationId);
      }

      router.push(route);
    };

    try {
      const lastResponse = Notifications.getLastNotificationResponse?.();
      if (lastResponse) {
        handleResponse(lastResponse);
      }
    } catch {
      // Some test/web environments expose partial notification modules.
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener?.(handleResponse);

    return () => {
      subscription?.remove();
    };
  }, [router]);
};

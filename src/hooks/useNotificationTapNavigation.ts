import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import type * as NotificationsType from "expo-notifications";
import { useNotificationCardStore } from "../stores";
import {
  isNotificationCardPayload,
  type NotificationCardPayload,
} from "../types/notificationCard";

type NotificationsModule = typeof import("expo-notifications");

let cachedNotificationsModule: NotificationsModule | null | undefined;

const getNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotificationsModule !== undefined) {
    return cachedNotificationsModule;
  }

  try {
    cachedNotificationsModule = require("expo-notifications");
  } catch {
    cachedNotificationsModule = null;
  }

  return cachedNotificationsModule ?? null;
};

const getRequestId = (response: NotificationsType.NotificationResponse) =>
  response.notification.request.identifier;

const getPayloadFromResponse = (
  response: NotificationsType.NotificationResponse,
): NotificationCardPayload | null => {
  const data = response.notification.request.content.data;
  if (!isNotificationCardPayload(data)) return null;
  return data;
};

export const useNotificationTapNavigation = () => {
  const router = useRouter();
  const lastHandledRequestIdRef = useRef<string | null>(null);
  const setPendingNotificationCard = useNotificationCardStore(
    (state) => state.setPendingNotificationCard,
  );

  const handleNotificationResponse = useCallback(
    (response: NotificationsType.NotificationResponse) => {
      const requestId = getRequestId(response);
      if (lastHandledRequestIdRef.current === requestId) {
        return;
      }

      const payload = getPayloadFromResponse(response);
      if (!payload) {
        return;
      }

      lastHandledRequestIdRef.current = requestId;
      setPendingNotificationCard(payload);
      router.push("/notification-card");
    },
    [router, setPendingNotificationCard],
  );

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    let isMounted = true;

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!isMounted || !response) return;
        handleNotificationResponse(response);
        if ("clearLastNotificationResponseAsync" in Notifications) {
          void Notifications.clearLastNotificationResponseAsync().catch(() => {});
        }
      })
      .catch((error) => {
        console.warn("Failed to read last notification response", error);
      });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [handleNotificationResponse]);
};

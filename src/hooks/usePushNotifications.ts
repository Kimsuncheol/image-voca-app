import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext";
import { upsertCurrentDeviceRegistration } from "../services/deviceRegistrationService";
import {
  cancelAllScheduledNotifications,
  configureNotifications,
  getNotificationsEnabledPreference,
  isPermissionGranted,
  markStudyDate,
  scheduleDailyNotifications,
} from "../utils/notifications";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      syncedUserIdRef.current = null;
    }
  }, [user]);

  const setupNotifications = useCallback(async () => {
    try {
      const enabled = await getNotificationsEnabledPreference();
      if (!enabled) {
        await cancelAllScheduledNotifications();
        return;
      }

      const permissions = await configureNotifications();
      if (user?.uid && syncedUserIdRef.current !== user.uid) {
        syncedUserIdRef.current = user.uid;
        try {
          await upsertCurrentDeviceRegistration(user);
        } catch (error) {
          console.warn("Failed to refresh device registration", error);
        }
      }

      if (!isPermissionGranted(permissions)) return;

      await markStudyDate();
      await scheduleDailyNotifications(user?.uid);
    } catch (error) {
      console.warn("Failed to configure notifications", error);
    }
  }, [user]);

  useEffect(() => {
    setupNotifications();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setupNotifications();
      }
    });
    return () => subscription.remove();
  }, [setupNotifications]);
};

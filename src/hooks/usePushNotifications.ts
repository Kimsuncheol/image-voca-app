import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext";
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

  const setupNotifications = useCallback(async () => {
    try {
      const enabled = await getNotificationsEnabledPreference();
      if (!enabled) {
        await cancelAllScheduledNotifications();
        return;
      }

      const permissions = await configureNotifications();
      if (!isPermissionGranted(permissions)) return;

      await markStudyDate();
      await scheduleDailyNotifications(user?.uid);
    } catch (error) {
      console.warn("Failed to configure notifications", error);
    }
  }, [user?.uid]);

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

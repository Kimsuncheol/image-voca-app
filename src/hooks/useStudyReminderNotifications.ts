import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  cancelAllScheduledNotifications,
  configureNotifications,
  getStudyReminderEnabledPreference,
  isPermissionGranted,
  markStudyDate,
  scheduleDailyNotifications,
} from "../utils/notifications";

export const useStudyReminderNotifications = () => {
  const { authStatus } = useAuth();

  const setupStudyReminderNotifications = useCallback(async () => {
    if (authStatus !== "signed_in") {
      return;
    }

    try {
      const enabled = await getStudyReminderEnabledPreference();
      if (!enabled) {
        await cancelAllScheduledNotifications();
        return;
      }

      const permissions = await configureNotifications();
      if (!isPermissionGranted(permissions)) return;

      await markStudyDate();
      await scheduleDailyNotifications();
    } catch (error) {
      console.warn("Failed to configure study reminder notifications", error);
    }
  }, [authStatus]);

  useEffect(() => {
    setupStudyReminderNotifications();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setupStudyReminderNotifications();
      }
    });
    return () => subscription.remove();
  }, [setupStudyReminderNotifications]);
};

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { upsertCurrentDeviceRegistration } from "../services/deviceRegistrationService";
import { ensureUserProfileDocument } from "../services/userProfileService";

export const useAuthenticatedDeviceRegistration = () => {
  const { user } = useAuth();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      syncedUserIdRef.current = null;
      return;
    }

    if (syncedUserIdRef.current === user.uid) {
      return;
    }

    syncedUserIdRef.current = user.uid;

    void (async () => {
      try {
        await ensureUserProfileDocument(user);
      } catch (error) {
        console.warn("Failed to ensure user profile document", error);
        return;
      }

      try {
        await upsertCurrentDeviceRegistration(user);
      } catch (error) {
        console.warn("Failed to register authenticated device", error);
      }
    })();
  }, [user]);
};

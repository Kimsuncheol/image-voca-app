import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  DeviceRegistrationLimitError,
  upsertCurrentDeviceRegistration,
} from "../services/deviceRegistrationService";
import { auth } from "../services/firebase";
import { ensureUserProfileDocument } from "../services/userProfileService";

export const useAuthenticatedDeviceRegistration = () => {
  const { user, authStatus, setAuthError } = useAuth();
  const { t } = useTranslation();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid || authStatus !== "signed_in") {
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
        if (error instanceof DeviceRegistrationLimitError) {
          setAuthError(t("auth.errors.deviceLimitReached"));
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.warn("Failed to sign out after device limit check", signOutError);
          }
          return;
        }
        console.warn("Failed to register authenticated device", error);
      }
    })();
  }, [authStatus, setAuthError, t, user]);
};

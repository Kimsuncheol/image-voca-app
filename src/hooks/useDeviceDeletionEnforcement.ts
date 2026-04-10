import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  getOrCreateDeviceId,
  isNativeDeviceRegistrationSupported,
} from "../services/deviceRegistrationService";
import { auth, db } from "../services/firebase";

/**
 * Listens to this device's registration document in Firestore.
 * When the document is deleted (e.g. removed by another device or admin),
 * the current device is immediately signed out.
 *
 * Path: users/{userId}/devices/{deviceId}
 */
export const useDeviceDeletionEnforcement = () => {
  const { user, authStatus, setAuthError } = useAuth();
  const { t } = useTranslation();
  const forcedLogoutFiredRef = useRef(false);

  useEffect(() => {
    if (!isNativeDeviceRegistrationSupported()) return;

    if (!user?.uid || authStatus !== "signed_in") {
      forcedLogoutFiredRef.current = false;
      return;
    }

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;
    // Only trigger logout when transitioning from existing → deleted.
    // This prevents a false logout during the race window before
    // upsertCurrentDeviceRegistration completes on first launch.
    let hadExisted = false;

    void getOrCreateDeviceId()
      .then((deviceId) => {
        if (isCancelled) return;

        unsubscribe = onSnapshot(
          doc(db, "users", user.uid, "devices", deviceId),
          (snapshot) => {
            if (snapshot.exists()) {
              hadExisted = true;
              return;
            }

            if (!hadExisted) return;
            if (forcedLogoutFiredRef.current) return;
            forcedLogoutFiredRef.current = true;

            setAuthError(t("auth.errors.deviceRemoved"));
            signOut(auth).catch((error) => {
              console.warn("Failed to sign out after device removal", error);
            });
          },
          (error) => {
            console.warn("Device deletion enforcement listener error", error);
          },
        );
      })
      .catch((error) => {
        console.warn("Failed to start device deletion enforcement", error);
      });

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [authStatus, setAuthError, t, user?.uid]);
};

import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentDeviceSessionId,
  getOrCreateDeviceId,
  isNativeDeviceRegistrationSupported,
} from "../services/deviceRegistrationService";
import { auth, db } from "../services/firebase";

const maskIdentifier = (value?: string | null) =>
  value ? `...${value.slice(-6)}` : null;

const logSessionEnforcementProcess = (
  event: string,
  details?: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV === "production") return;
  console.info("[SessionEnforcement]", event, details ?? {});
};

/**
 * Enforces the backend-owned single active session for native mobile devices.
 * A Firestore session mismatch means another login replaced this device.
 */
export const useSessionEnforcement = () => {
  const { user, authStatus, setAuthError } = useAuth();
  const { t } = useTranslation();
  const currentDeviceIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const forcedLogoutFiredRef = useRef(false);

  useEffect(() => {
    if (!isNativeDeviceRegistrationSupported()) {
      logSessionEnforcementProcess("listener skipped: unsupported platform");
      return;
    }

    if (!user?.uid || authStatus !== "signed_in") {
      forcedLogoutFiredRef.current = false;
      logSessionEnforcementProcess("listener inactive: user is not signed in", {
        authStatus,
      });
      return;
    }

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    void Promise.all([getOrCreateDeviceId(), getCurrentDeviceSessionId()])
      .then(([deviceId, sessionId]) => {
        if (isCancelled) return;

        currentDeviceIdRef.current = deviceId;
        currentSessionIdRef.current = sessionId;
        forcedLogoutFiredRef.current = false;

        logSessionEnforcementProcess("listener subscribing", {
          uid: maskIdentifier(user.uid),
          deviceId: maskIdentifier(deviceId),
          sessionId: maskIdentifier(sessionId),
        });

        unsubscribe = onSnapshot(
          doc(db, "users", user.uid),
          (snapshot) => {
            if (!snapshot.exists()) {
              logSessionEnforcementProcess("snapshot ignored: user doc missing", {
                uid: maskIdentifier(user.uid),
              });
              return;
            }

            const activeSessionDeviceId = snapshot.get(
              "activeSessionDeviceId",
            ) as string | undefined;
            const activeSessionId = snapshot.get("activeSessionId") as
              | string
              | undefined;

            if (!activeSessionDeviceId) {
              logSessionEnforcementProcess("snapshot ignored: no active session", {
                uid: maskIdentifier(user.uid),
              });
              return;
            }

            if (
              activeSessionDeviceId === currentDeviceIdRef.current &&
              (!activeSessionId ||
                !currentSessionIdRef.current ||
                activeSessionId === currentSessionIdRef.current)
            ) {
              logSessionEnforcementProcess("active session confirmed", {
                uid: maskIdentifier(user.uid),
                deviceId: maskIdentifier(activeSessionDeviceId),
                sessionId: maskIdentifier(activeSessionId),
              });
              return;
            }

            if (forcedLogoutFiredRef.current) return;
            forcedLogoutFiredRef.current = true;

            logSessionEnforcementProcess("forced logout triggered", {
              uid: maskIdentifier(user.uid),
              localDeviceId: maskIdentifier(currentDeviceIdRef.current),
              localSessionId: maskIdentifier(currentSessionIdRef.current),
              activeSessionDeviceId: maskIdentifier(activeSessionDeviceId),
              activeSessionId: maskIdentifier(activeSessionId),
            });
            setAuthError(t("auth.errors.forcedLogout"));
            signOut(auth).catch((error) => {
              console.warn("Failed to sign out during session enforcement", error);
            });
          },
          (error) => {
            console.warn("Session enforcement listener error", error);
          },
        );
      })
      .catch((error) => {
        console.warn("Failed to start session enforcement", error);
      });

    return () => {
      isCancelled = true;
      unsubscribe?.();
      logSessionEnforcementProcess("listener unsubscribed", {
        uid: maskIdentifier(user.uid),
      });
    };
  }, [authStatus, setAuthError, t, user?.uid]);
};

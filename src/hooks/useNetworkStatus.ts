import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef, useState } from "react";

export type NetworkStatus = "idle" | "offline" | "reconnected";

const RECONNECTED_DISMISS_MS = 2500;

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>("idle");
  const prevConnected = useRef<boolean | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected !== false;

      // First event: establish baseline without triggering reconnected banner
      if (prevConnected.current === null) {
        prevConnected.current = connected;
        if (!connected) setStatus("offline");
        return;
      }

      const wasConnected = prevConnected.current;
      prevConnected.current = connected;

      if (!connected) {
        if (dismissTimer.current) {
          clearTimeout(dismissTimer.current);
          dismissTimer.current = null;
        }
        setStatus("offline");
      } else if (!wasConnected) {
        // offline → online transition
        setStatus("reconnected");
        dismissTimer.current = setTimeout(() => {
          setStatus("idle");
          dismissTimer.current = null;
        }, RECONNECTED_DISMISS_MS);
      }
    });

    return () => {
      unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  return {
    status,
    isConnected: status !== "offline",
  };
}

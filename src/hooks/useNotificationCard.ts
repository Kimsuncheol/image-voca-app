import { useEffect, useState } from "react";
import { useNotificationCardStore } from "../stores";
import type { NotificationCardPayload } from "../types/notificationCard";

/**
 * Reads the pending notification card from the global store,
 * copies it into local state so the screen can safely display it
 * even after the store entry has been cleared.
 */
export function useNotificationCard() {
  const pendingNotificationCard = useNotificationCardStore(
    (state) => state.pendingNotificationCard,
  );
  const clearPendingNotificationCard = useNotificationCardStore(
    (state) => state.clearPendingNotificationCard,
  );

  const [payload, setPayload] = useState<NotificationCardPayload | null>(
    pendingNotificationCard,
  );

  useEffect(() => {
    if (!pendingNotificationCard) return;
    setPayload(pendingNotificationCard);
    clearPendingNotificationCard();
  }, [clearPendingNotificationCard, pendingNotificationCard]);

  return { payload };
}

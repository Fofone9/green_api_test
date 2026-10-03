import { useEffect, useState } from "react";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import {
  checkNotificationSettings,
  deleteNotification,
  receiveNotification,
} from "../api/notifications";
import type { ChatEvent } from "./types";
import { waitForPoll } from "./waitForPoll";

export function useNotifications(
  credentials: GreenApiCredentials,
  onEvent: (event: ChatEvent) => void,
) {
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function poll() {
      setError("");
      const settings = await checkNotificationSettings(credentials, signal);
      if (signal.aborted || settings.status === "cancelled") return;
      if (settings.status === "error") {
        setError(settings.message);
        return;
      }
      while (!signal.aborted) {
        const received = await receiveNotification(credentials, signal);
        if (signal.aborted || received.status === "cancelled") return;
        if (received.status === "error") {
          setError(received.message);
          await waitForPoll(3000, signal);
          continue;
        }
        if (!received.data) {
          setError("");
          await waitForPoll(500, signal);
          continue;
        }
        if (received.data.event) onEvent(received.data.event);
        const deleted = await deleteNotification(
          credentials,
          received.data.receiptId,
          signal,
        );
        if (signal.aborted || deleted.status === "cancelled") return;
        if (deleted.status === "error") {
          setError(deleted.message);
          await waitForPoll(3000, signal);
        } else {
          setError("");
          await waitForPoll(100, signal);
        }
      }
    }
    void poll();
    return () => controller.abort();
  }, [credentials, onEvent, retryCount]);

  return { error, retry: () => setRetryCount((value) => value + 1) };
}

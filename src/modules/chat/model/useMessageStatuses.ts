import { useEffect, useRef, useState } from "react";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import type { ChatEvent, Conversation } from "./types";
import {
  pendingStatusMessages,
  syncMessageStatuses,
} from "./syncMessageStatuses";
import { waitForPoll } from "./waitForPoll";

export function useMessageStatuses(
  credentials: GreenApiCredentials,
  conversations: Conversation[],
  onEvent: (event: ChatEvent) => void,
) {
  const latestConversations = useRef(conversations);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    latestConversations.current = conversations;
  }, [conversations]);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function poll() {
      setError("");
      while (!signal.aborted) {
        const messages = pendingStatusMessages(latestConversations.current);
        const result = await syncMessageStatuses(
          credentials,
          messages,
          onEvent,
          signal,
        );
        if (signal.aborted || result.status === "cancelled") return;
        setError(result.status === "error" ? result.message : "");
        await waitForPoll(5000, signal);
      }
    }
    void poll();
    return () => controller.abort();
  }, [credentials, onEvent, retryCount]);

  return { error, retry: () => setRetryCount((count) => count + 1) };
}

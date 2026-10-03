import { useEffect, useRef, useState } from "react";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import { sendTextMessage } from "../api/sendTextMessage";
import type { ChatEvent, Conversation } from "./types";

export function useSendMessage(
  credentials: GreenApiCredentials,
  onEvent: (event: ChatEvent) => void,
) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<{
    chatId: string;
    message: string;
  } | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function send(chat: Conversation, text: string): Promise<boolean> {
    if (request.current) return false;
    const controller = new AbortController();
    request.current = controller;
    setIsSending(true);
    setError(null);
    const timestamp = Date.now() / 1000;
    const result = await sendTextMessage(
      credentials,
      chat.id,
      text,
      controller.signal,
    );
    if (controller.signal.aborted) return false;
    request.current = null;
    setIsSending(false);
    if (result.status === "error") {
      setError({ chatId: chat.id, message: result.message });
      return false;
    }
    if (result.status !== "success") return false;
    onEvent({
      type: "message",
      title: chat.title,
      phone: chat.phone,
      message: {
        id: result.data,
        chatId: chat.id,
        text,
        timestamp,
        direction: "outgoing",
        status: "queued",
      },
    });
    return true;
  }

  return { send, isSending, error };
}

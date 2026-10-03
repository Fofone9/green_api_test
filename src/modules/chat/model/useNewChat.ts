import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import { checkAccount } from "../api/checkAccount";
import { isValidPhone, normalizePhone } from "./phone";
import type { Conversation } from "./types";

export function useNewChat(
  credentials: GreenApiCredentials,
  conversations: Conversation[],
  onOpen: (chatId: string, phone: string) => void,
) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      setError("Введите номер с кодом страны, например +7 999 123-45-67.");
      return;
    }
    const existing = conversations.find((chat) => chat.phone === normalized);
    if (existing) {
      onOpen(existing.id, normalized);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setIsLoading(true);
    setError("");
    const result = await checkAccount(
      credentials,
      normalized,
      controller.signal,
    );
    if (controller.signal.aborted) return;
    request.current = null;
    setIsLoading(false);
    if (result.status === "error") setError(result.message);
    else if (result.status === "success") onOpen(result.data, normalized);
  }

  function updatePhone(value: string) {
    setPhone(value);
    setError("");
  }
  return { phone, error, isLoading, updatePhone, submit };
}

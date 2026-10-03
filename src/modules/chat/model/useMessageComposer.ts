import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { MAX_MESSAGE_LENGTH } from "../api/sendTextMessage";

export function useMessageComposer(
  isSending: boolean,
  onSend: (text: string) => Promise<boolean>,
) {
  const [text, setText] = useState("");
  const canSend =
    Boolean(text.trim()) && text.length <= MAX_MESSAGE_LENGTH && !isSending;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    if (await onSend(text)) setText("");
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (canSend) event.currentTarget.form?.requestSubmit();
    }
  }
  return { text, setText, canSend, submit, keyDown };
}

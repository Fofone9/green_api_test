import { useEffect, useRef } from "react";
import type { ChatMessage } from "../model/types";
import { MessageBubble } from "./MessageBubble";
import styles from "./MessageList.module.css";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);
  return (
    <div
      className={styles.list}
      role="log"
      aria-label="Сообщения"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {!messages.length && (
        <p className={styles.empty}>Напишите первое сообщение</p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={end} />
    </div>
  );
}

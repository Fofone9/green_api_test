import type { Conversation } from "../model/types";
import { ChatListItem } from "./ChatListItem";
import styles from "./ChatList.module.css";

interface ChatListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (chatId: string) => void;
}

export function ChatList({ conversations, activeId, onSelect }: ChatListProps) {
  if (!conversations.length)
    return (
      <p className={styles.empty}>
        Создайте чат по номеру телефона получателя.
      </p>
    );
  const sorted = [...conversations].sort(
    (a, b) =>
      (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0),
  );
  return (
    <ul className={styles.list}>
      {sorted.map((chat) => (
        <li key={chat.id}>
          <ChatListItem
            chat={chat}
            isActive={chat.id === activeId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

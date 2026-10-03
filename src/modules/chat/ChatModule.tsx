import type { GreenApiCredentials } from "../../shared/api/green-api/types";
import { useChatStore } from "./model/useChatStore";
import { useNotifications } from "./model/useNotifications";
import { useSendMessage } from "./model/useSendMessage";
import { ChatSidebar } from "./ui/ChatSidebar";
import { ConversationView } from "./ui/ConversationView";
import { EmptyChat } from "./ui/EmptyChat";
import styles from "./ChatModule.module.css";

interface ChatModuleProps {
  credentials: GreenApiCredentials;
  onDisconnect: () => void;
}

export function ChatModule({ credentials, onDisconnect }: ChatModuleProps) {
  const { conversations, activeChat, onEvent, openChat, selectChat } =
    useChatStore();
  const notifications = useNotifications(credentials, onEvent);
  const sender = useSendMessage(credentials, onEvent);

  return (
    <main
      className={`${styles.layout} ${activeChat ? styles.hasActiveChat : ""}`}
    >
      <div className={styles.sidebar}>
        <ChatSidebar
          credentials={credentials}
          conversations={conversations}
          activeId={activeChat?.id ?? null}
          onOpen={openChat}
          onSelect={selectChat}
          onDisconnect={onDisconnect}
        />
      </div>
      <section className={styles.conversation} aria-label="Переписка">
        {notifications.error && (
          <div className={styles.notice} role="alert">
            <span>{notifications.error}</span>
            <button type="button" onClick={notifications.retry}>
              Повторить
            </button>
          </div>
        )}
        {activeChat ? (
          <ConversationView
            key={activeChat.id}
            chat={activeChat}
            isSending={sender.isSending}
            error={
              sender.error?.chatId === activeChat.id ? sender.error.message : ""
            }
            onSend={(text) => sender.send(activeChat, text)}
            onBack={() => selectChat(null)}
          />
        ) : (
          <EmptyChat />
        )}
      </section>
    </main>
  );
}

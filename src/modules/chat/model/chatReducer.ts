import type {
  ChatEvent,
  ChatMessage,
  Conversation,
  DeliveryStatus,
} from "./types";

export interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  statuses: Record<string, DeliveryStatus>;
}

export const initialChatState: ChatState = {
  conversations: [],
  activeId: null,
  statuses: {},
};

export type ChatAction =
  | { type: "open"; chatId: string; phone: string }
  | { type: "select"; chatId: string | null }
  | { type: "event"; event: ChatEvent };

const statusOrder: Record<DeliveryStatus, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
  noAccount: 4,
};

function latestStatus(a: DeliveryStatus, b: DeliveryStatus): DeliveryStatus {
  return statusOrder[a] >= statusOrder[b] ? a : b;
}

function mergeMessage(
  messages: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  const existing = messages.find((item) => item.id === message.id);
  if (existing)
    return messages.map((item) =>
      item.id === message.id
        ? {
            ...item,
            ...message,
            status: latestStatus(item.status, message.status),
          }
        : item,
    );
  return [...messages, message].sort((a, b) => a.timestamp - b.timestamp);
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  if (action.type === "select")
    return {
      ...state,
      activeId: action.chatId,
      conversations: state.conversations.map((chat) =>
        chat.id === action.chatId ? { ...chat, unread: 0 } : chat,
      ),
    };
  if (action.type === "open") {
    const exists = state.conversations.some(
      (chat) => chat.id === action.chatId,
    );
    return {
      ...state,
      activeId: action.chatId,
      conversations: exists
        ? state.conversations.map((chat) =>
            chat.id === action.chatId
              ? { ...chat, phone: action.phone, unread: 0 }
              : chat,
          )
        : [
            ...state.conversations,
            {
              id: action.chatId,
              phone: action.phone,
              title: `+${action.phone}`,
              messages: [],
              unread: 0,
            },
          ],
    };
  }
  const event = action.event;
  if (event.type === "status") {
    const chat = state.conversations.find((item) => item.id === event.chatId);
    const queued =
      chat?.messages.filter(
        (item) => item.direction === "outgoing" && item.status === "queued",
      ) ?? [];
    const id = event.idMessage ?? (queued.length === 1 ? queued[0].id : null);
    if (!id) return state;
    const key = `${event.chatId}:${id}`;
    const status = latestStatus(state.statuses[key] ?? "queued", event.status);
    return {
      ...state,
      statuses: { ...state.statuses, [key]: status },
      conversations: state.conversations.map((item) =>
        item.id === event.chatId
          ? {
              ...item,
              messages: item.messages.map((message) =>
                message.id === id
                  ? { ...message, status: latestStatus(message.status, status) }
                  : message,
              ),
            }
          : item,
      ),
    };
  }
  const { message } = event;
  const storedStatus = state.statuses[`${message.chatId}:${message.id}`];
  const updatedMessage = storedStatus
    ? { ...message, status: latestStatus(message.status, storedStatus) }
    : message;
  const existing = state.conversations.find(
    (chat) => chat.id === message.chatId,
  );
  const unread =
    message.direction === "incoming" && state.activeId !== message.chatId
      ? 1
      : 0;
  if (!existing)
    return {
      ...state,
      conversations: [
        ...state.conversations,
        {
          id: message.chatId,
          title: event.title,
          phone: event.phone,
          messages: [updatedMessage],
          unread,
        },
      ],
    };
  const isDuplicate = existing.messages.some((item) => item.id === message.id);
  return {
    ...state,
    conversations: state.conversations.map((chat) =>
      chat.id === message.chatId
        ? {
            ...chat,
            title: event.title || chat.title,
            phone: event.phone || chat.phone,
            messages: mergeMessage(chat.messages, updatedMessage),
            unread: chat.unread + (isDuplicate ? 0 : unread),
          }
        : chat,
    ),
  };
}

import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type { JsonValue } from "../../../shared/api/green-api/json";
import type { ChatState } from "./chatReducer";
import type { ChatMessage, Conversation, DeliveryStatus } from "./types";

function isDeliveryStatus(
  value: JsonValue | undefined,
): value is DeliveryStatus {
  return (
    value === "queued" ||
    value === "sent" ||
    value === "delivered" ||
    value === "read" ||
    value === "failed" ||
    value === "noAccount"
  );
}

function parseMessage(value: JsonValue, chatId: string): ChatMessage | null {
  const data = asJsonObject(value);
  if (
    !data ||
    typeof data.id !== "string" ||
    !data.id ||
    data.chatId !== chatId ||
    typeof data.text !== "string" ||
    typeof data.timestamp !== "number" ||
    !Number.isFinite(data.timestamp) ||
    data.timestamp < 0 ||
    data.timestamp > 8_640_000_000_000 ||
    (data.direction !== "incoming" && data.direction !== "outgoing") ||
    !isDeliveryStatus(data.status)
  )
    return null;
  return {
    id: data.id,
    chatId,
    text: data.text,
    timestamp: data.timestamp,
    direction: data.direction,
    status: data.status,
  };
}

function parseConversation(value: JsonValue): Conversation | null {
  const data = asJsonObject(value);
  if (
    !data ||
    typeof data.id !== "string" ||
    !data.id ||
    typeof data.title !== "string" ||
    typeof data.phone !== "string" ||
    typeof data.unread !== "number" ||
    !Number.isSafeInteger(data.unread) ||
    data.unread < 0 ||
    !Array.isArray(data.messages)
  )
    return null;
  const messages: ChatMessage[] = [];
  const ids = new Set<string>();
  for (const item of data.messages) {
    const message = parseMessage(item, data.id);
    if (!message || ids.has(message.id)) return null;
    ids.add(message.id);
    messages.push(message);
  }
  messages.sort((a, b) => a.timestamp - b.timestamp);
  return {
    id: data.id,
    title: data.title,
    phone: data.phone,
    unread: data.unread,
    messages,
  };
}

export function parseSavedChat(body: string): ChatState | null {
  const data = asJsonObject(parseJson(body));
  const saved = asJsonObject(data?.state);
  const savedStatuses = asJsonObject(saved?.statuses);
  if (
    data?.version !== 1 ||
    !saved ||
    !Array.isArray(saved.conversations) ||
    !savedStatuses ||
    (saved.activeId !== null && typeof saved.activeId !== "string")
  )
    return null;
  const conversations: Conversation[] = [];
  const ids = new Set<string>();
  for (const item of saved.conversations) {
    const chat = parseConversation(item);
    if (!chat || ids.has(chat.id)) return null;
    ids.add(chat.id);
    conversations.push(chat);
  }
  const statuses: [string, DeliveryStatus][] = [];
  for (const [key, value] of Object.entries(savedStatuses)) {
    if (!isDeliveryStatus(value)) return null;
    statuses.push([key, value]);
  }
  return {
    conversations,
    activeId: saved.activeId && ids.has(saved.activeId) ? saved.activeId : null,
    statuses: Object.fromEntries(statuses),
  };
}

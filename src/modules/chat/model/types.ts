export type DeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "noAccount";

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: "incoming" | "outgoing";
  status: DeliveryStatus;
}

export interface Conversation {
  id: string;
  title: string;
  phone: string;
  messages: ChatMessage[];
  unread: number;
}

export type ChatEvent =
  | { type: "message"; message: ChatMessage; title: string; phone: string }
  | {
      type: "status";
      chatId: string;
      idMessage: string | null;
      status: DeliveryStatus;
    };

export interface ChatNotification {
  receiptId: number;
  event: ChatEvent | null;
}

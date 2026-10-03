import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type { JsonObject } from "../../../shared/api/green-api/json";
import type {
  ChatEvent,
  ChatNotification,
  DeliveryStatus,
} from "../model/types";

function parseStatus(value: string): DeliveryStatus | null {
  switch (value) {
    case "delivered":
    case "read":
    case "failed":
    case "noAccount":
      return value;
    default:
      return null;
  }
}

function parseEvent(body: JsonObject): ChatEvent | null {
  if (body.typeWebhook === "outgoingMessageStatus") {
    const status =
      typeof body.status === "string" ? parseStatus(body.status) : null;
    if (!status || typeof body.chatId !== "string") return null;
    return {
      type: "status",
      chatId: body.chatId,
      idMessage: typeof body.idMessage === "string" ? body.idMessage : null,
      status,
    };
  }
  const incoming = body.typeWebhook === "incomingMessageReceived";
  const outgoing =
    body.typeWebhook === "outgoingAPIMessageReceived" ||
    body.typeWebhook === "outgoingMessageReceived";
  if (!incoming && !outgoing) return null;
  const sender = asJsonObject(body.senderData);
  const messageData = asJsonObject(body.messageData);
  if (
    !sender ||
    !messageData ||
    typeof sender.chatId !== "string" ||
    !sender.chatId
  )
    return null;
  if (sender.chatType && sender.chatType !== "user") return null;
  let text: string | null = null;
  if (messageData.typeMessage === "textMessage") {
    const data = asJsonObject(messageData.textMessageData);
    if (typeof data?.textMessage === "string") text = data.textMessage;
  } else if (messageData.typeMessage === "extendedTextMessage") {
    const data = asJsonObject(messageData.extendedTextMessageData);
    if (typeof data?.text === "string") text = data.text;
  }
  if (
    text === null ||
    typeof body.idMessage !== "string" ||
    !body.idMessage ||
    typeof body.timestamp !== "number" ||
    !Number.isFinite(body.timestamp) ||
    body.timestamp < 0
  )
    return null;
  const phone =
    typeof sender.senderPhoneNumber === "number" && sender.senderPhoneNumber > 0
      ? String(sender.senderPhoneNumber)
      : "";
  const title =
    typeof sender.chatName === "string" && sender.chatName
      ? sender.chatName
      : phone
        ? `+${phone}`
        : sender.chatId;
  return {
    type: "message",
    title,
    phone,
    message: {
      id: body.idMessage,
      chatId: sender.chatId,
      text,
      timestamp: body.timestamp,
      direction: incoming ? "incoming" : "outgoing",
      status: incoming ? "delivered" : "sent",
    },
  };
}

export function parseNotification(
  body: string,
): ChatNotification | null | undefined {
  const value = parseJson(body);
  if (value === null || body.trim() === "") return null;
  const data = asJsonObject(value);
  const webhook = asJsonObject(data?.body);
  if (
    !data ||
    !webhook ||
    typeof data.receiptId !== "number" ||
    !Number.isSafeInteger(data.receiptId) ||
    data.receiptId <= 0
  )
    return undefined;
  return { receiptId: data.receiptId, event: parseEvent(webhook) };
}

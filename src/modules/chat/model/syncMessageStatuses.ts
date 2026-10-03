import type {
  ApiResult,
  GreenApiCredentials,
} from "../../../shared/api/green-api/types";
import { getMessageStatus } from "../api/getMessageStatus.ts";
import type { ChatEvent, ChatMessage, Conversation } from "./types";
import { waitForPoll } from "./waitForPoll.ts";

export function pendingStatusMessages(
  conversations: Conversation[],
): ChatMessage[] {
  return conversations.flatMap((chat) =>
    chat.messages.filter(
      (message) =>
        message.direction === "outgoing" &&
        (message.status === "queued" ||
          message.status === "sent" ||
          message.status === "delivered"),
    ),
  );
}

export async function syncMessageStatuses(
  credentials: GreenApiCredentials,
  messages: ChatMessage[],
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<ApiResult<boolean>> {
  let error = "";
  for (let index = 0; index < messages.length; index += 1) {
    if (index > 0) await waitForPoll(1000, signal);
    if (signal.aborted) return { status: "cancelled" };
    const message = messages[index];
    const result = await getMessageStatus(
      credentials,
      message.chatId,
      message.id,
      signal,
    );
    if (signal.aborted || result.status === "cancelled")
      return { status: "cancelled" };
    if (result.status === "error") {
      error ||= result.message;
      continue;
    }
    if (result.data && result.data !== message.status) {
      onEvent({
        type: "status",
        chatId: message.chatId,
        idMessage: message.id,
        status: result.data,
      });
    }
  }
  return error
    ? { status: "error", message: error }
    : { status: "success", data: true };
}

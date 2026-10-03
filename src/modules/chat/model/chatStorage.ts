import {
  readStorage,
  writeStorage,
} from "../../../shared/storage/browserStorage.ts";
import { initialChatState } from "./chatReducer.ts";
import type { ChatState } from "./chatReducer";
import { parseSavedChat } from "./parseSavedChat.ts";

function chatStorageKey(idInstance: string): string {
  return `telegram-chat:history:v1:${encodeURIComponent(idInstance)}`;
}

export function loadChatState(idInstance: string): ChatState {
  const body = readStorage(chatStorageKey(idInstance));
  return body ? (parseSavedChat(body) ?? initialChatState) : initialChatState;
}

export function saveChatState(idInstance: string, state: ChatState): boolean {
  return writeStorage(
    chatStorageKey(idInstance),
    JSON.stringify({ version: 1, state }),
  );
}

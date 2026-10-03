import { useCallback, useReducer } from "react";
import { chatReducer, initialChatState } from "./chatReducer";
import type { ChatEvent } from "./types";

export function useChatStore() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const onEvent = useCallback(
    (event: ChatEvent) => dispatch({ type: "event", event }),
    [],
  );
  const openChat = useCallback(
    (chatId: string, phone: string) =>
      dispatch({ type: "open", chatId, phone }),
    [],
  );
  const selectChat = useCallback(
    (chatId: string | null) => dispatch({ type: "select", chatId }),
    [],
  );
  const activeChat =
    state.conversations.find((chat) => chat.id === state.activeId) ?? null;
  return {
    conversations: state.conversations,
    activeChat,
    onEvent,
    openChat,
    selectChat,
  };
}

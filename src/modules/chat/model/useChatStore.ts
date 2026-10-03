import { useCallback, useEffect, useReducer, useState } from "react";
import { chatReducer } from "./chatReducer";
import { loadChatState, saveChatState } from "./chatStorage";
import type { ChatEvent } from "./types";

export function useChatStore(idInstance: string) {
  const [state, dispatch] = useReducer(chatReducer, idInstance, loadChatState);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    const saved = saveChatState(idInstance, state);
    // Результат записи во внешнее хранилище нужен для сообщения об ошибке.
    // oxlint-disable-next-line react/set-state-in-effect
    setStorageError(
      saved
        ? ""
        : "Браузер не смог сохранить переписку. Проверьте доступность и свободное место локального хранилища.",
    );
  }, [idInstance, state]);
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
    storageError,
    conversations: state.conversations,
    activeChat,
    onEvent,
    openChat,
    selectChat,
  };
}

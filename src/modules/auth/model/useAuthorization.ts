import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GreenApiCredentials,
  InstanceState,
} from "../../../shared/api/green-api/types";
import { getStateInstance } from "../api/getStateInstance";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from "./credentialStorage";

type AuthorizationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "connected"; credentials: GreenApiCredentials };

const instanceMessages: Record<Exclude<InstanceState, "authorized">, string> = {
  notAuthorized:
    "Инстанс не авторизован в Telegram. Подключите его в личном кабинете GREEN-API и повторите попытку.",
  blocked:
    "Аккаунт Telegram заблокирован. Проверьте его состояние в личном кабинете GREEN-API.",
  starting:
    "Инстанс запускается. Подождите несколько минут и повторите попытку.",
  suspended:
    "На аккаунте Telegram действуют ограничения. Проверьте их в личном кабинете GREEN-API.",
  pendingPassword:
    "Завершите двухфакторную авторизацию инстанса в личном кабинете GREEN-API.",
};

export function useAuthorization() {
  const [restoredCredentials] = useState(loadCredentials);
  const [state, setState] = useState<AuthorizationState>(
    restoredCredentials ? { status: "loading" } : { status: "idle" },
  );
  const [storageError, setStorageError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  const checkConnection = useCallback(
    async (credentials: GreenApiCredentials) => {
      if (activeRequest.current) return;
      const controller = new AbortController();
      activeRequest.current = controller;

      const result = await getStateInstance(credentials, controller.signal);
      if (controller.signal.aborted) return;
      activeRequest.current = null;

      if (result.status === "error")
        setState({ status: "error", message: result.message });
      else if (result.status === "success") {
        if (result.stateInstance === "authorized") {
          setStorageError(
            saveCredentials(credentials)
              ? ""
              : "Браузер не смог сохранить авторизацию. После перезагрузки потребуется повторный вход.",
          );
        }
        setState(
          result.stateInstance === "authorized"
            ? { status: "connected", credentials }
            : {
                status: "error",
                message: instanceMessages[result.stateInstance],
              },
        );
      }
    },
    [],
  );

  async function connect(credentials: GreenApiCredentials) {
    if (activeRequest.current) return;
    setState({ status: "loading" });
    await checkConnection(credentials);
  }

  useEffect(() => {
    // Состояние обновляется после асинхронной проверки сохранённого инстанса.
    // oxlint-disable-next-line react/set-state-in-effect
    if (restoredCredentials) void checkConnection(restoredCredentials);
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [restoredCredentials, checkConnection]);

  function clearError() {
    setState((current) =>
      current.status === "error" ? { status: "idle" } : current,
    );
  }

  function disconnect() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setStorageError("");
    setState(
      clearCredentials()
        ? { status: "idle" }
        : {
            status: "error",
            message:
              "Не удалось удалить сохранённую авторизацию. Очистите данные сайта в браузере.",
          },
    );
  }

  return { state, storageError, connect, clearError, disconnect };
}

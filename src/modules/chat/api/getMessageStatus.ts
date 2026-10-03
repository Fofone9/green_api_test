import { requestGreenApi } from "../../../shared/api/green-api/request.ts";
import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type {
  ApiResult,
  GreenApiCredentials,
} from "../../../shared/api/green-api/types";

type MessageStatus = "delivered" | "read";

export async function getMessageStatus(
  credentials: GreenApiCredentials,
  chatId: string,
  idMessage: string,
  signal: AbortSignal,
): Promise<ApiResult<MessageStatus | null>> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "getMessage",
    method: "POST",
    signal,
    body: JSON.stringify({ chatId, idMessage }),
  });
  if (result.status !== "success") return result;
  const value = parseJson(result.body);
  const data = asJsonObject(value);
  if (value === null || (data && Object.keys(data).length === 0)) {
    return { status: "success", data: null };
  }
  if (
    data?.type === "outgoing" &&
    data.chatId === chatId &&
    data.idMessage === idMessage &&
    (data.statusMessage === "delivered" || data.statusMessage === "read")
  ) {
    return { status: "success", data: data.statusMessage };
  }
  return {
    status: "error",
    message:
      "Не удалось проверить статус сообщения. Повторим проверку автоматически.",
  };
}

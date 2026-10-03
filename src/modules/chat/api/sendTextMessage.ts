import { requestGreenApi } from "../../../shared/api/green-api/request.ts";
import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type {
  ApiResult,
  GreenApiCredentials,
} from "../../../shared/api/green-api/types";

export const MAX_MESSAGE_LENGTH = 4096;

export async function sendTextMessage(
  credentials: GreenApiCredentials,
  chatId: string,
  text: string,
  signal: AbortSignal,
): Promise<ApiResult<string>> {
  if (!text.trim() || text.length > MAX_MESSAGE_LENGTH) {
    return {
      status: "error",
      message: "Введите сообщение длиной от 1 до 4096 символов.",
    };
  }
  const result = await requestGreenApi({
    credentials,
    apiMethod: "sendMessage",
    method: "POST",
    signal,
    body: JSON.stringify({ chatId, message: text }),
  });
  if (result.status !== "success") return result;
  const data = asJsonObject(parseJson(result.body));
  return typeof data?.idMessage === "string" && data.idMessage
    ? { status: "success", data: data.idMessage }
    : {
        status: "error",
        message:
          "Сервер не подтвердил отправку. Проверьте Telegram перед повторной попыткой.",
      };
}

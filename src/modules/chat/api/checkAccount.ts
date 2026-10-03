import { requestGreenApi } from "../../../shared/api/green-api/request.ts";
import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type {
  ApiResult,
  GreenApiCredentials,
} from "../../../shared/api/green-api/types";

export async function checkAccount(
  credentials: GreenApiCredentials,
  phone: string,
  signal: AbortSignal,
): Promise<ApiResult<string>> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "checkAccount",
    method: "POST",
    signal,
    body: JSON.stringify({ phoneNumber: Number(phone) }),
  });
  if (result.status !== "success") return result;
  const data = asJsonObject(parseJson(result.body));
  if (data?.exist === false)
    return {
      status: "error",
      message:
        "Аккаунт Telegram не найден или номер скрыт настройками приватности.",
    };
  if (data?.exist === true && typeof data.chatId === "string" && data.chatId) {
    return { status: "success", data: data.chatId };
  }
  return {
    status: "error",
    message:
      "Не удалось определить получателя. Проверьте состояние инстанса и ограничения Telegram.",
  };
}

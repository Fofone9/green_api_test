import { requestGreenApi } from "../../../shared/api/green-api/request.ts";
import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type {
  ApiResult,
  GreenApiCredentials,
} from "../../../shared/api/green-api/types";
import type { ChatNotification } from "../model/types";
import { parseNotification } from "./parseNotification.ts";

export async function receiveNotification(
  credentials: GreenApiCredentials,
  signal: AbortSignal,
): Promise<ApiResult<ChatNotification | null>> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "receiveNotification",
    signal,
  });
  if (result.status !== "success") return result;
  const notification = parseNotification(result.body);
  return notification === undefined
    ? {
        status: "error",
        message: "Не удалось прочитать уведомление GREEN-API.",
      }
    : { status: "success", data: notification };
}

export async function deleteNotification(
  credentials: GreenApiCredentials,
  receiptId: number,
  signal: AbortSignal,
): Promise<ApiResult<boolean>> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "deleteNotification",
    method: "DELETE",
    pathSegments: [String(receiptId)],
    signal,
  });
  if (result.status !== "success") return result;
  const data = asJsonObject(parseJson(result.body));
  return typeof data?.result === "boolean"
    ? { status: "success", data: data.result }
    : {
        status: "error",
        message: "Не удалось подтвердить получение уведомления.",
      };
}

export async function checkNotificationSettings(
  credentials: GreenApiCredentials,
  signal: AbortSignal,
): Promise<ApiResult<boolean>> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "getSettings",
    signal,
  });
  if (result.status !== "success") return result;
  const data = asJsonObject(parseJson(result.body));
  if (
    typeof data?.incomingWebhook !== "string" ||
    typeof data.webhookUrl !== "string"
  ) {
    return {
      status: "error",
      message: "Не удалось проверить настройки входящих сообщений.",
    };
  }
  return data.incomingWebhook === "yes" && data.webhookUrl === ""
    ? { status: "success", data: true }
    : {
        status: "error",
        message:
          "В личном кабинете GREEN-API включите уведомления о входящих сообщениях и оставьте Webhook URL пустым. Затем нажмите «Повторить».",
      };
}

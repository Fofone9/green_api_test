import type {
  GreenApiCredentials,
  InstanceState,
} from "../../../shared/api/green-api/types";
import { requestGreenApi } from "../../../shared/api/green-api/request.ts";
import { parseInstanceState } from "./parseInstanceState.ts";

type StateResult =
  | { status: "success"; stateInstance: InstanceState }
  | { status: "error"; message: string }
  | { status: "cancelled" };

export async function getStateInstance(
  credentials: GreenApiCredentials,
  signal: AbortSignal,
): Promise<StateResult> {
  const result = await requestGreenApi({
    credentials,
    apiMethod: "getStateInstance",
    signal,
  });
  if (result.status !== "success") return result;

  const stateInstance = parseInstanceState(result.body);
  return stateInstance
    ? { status: "success", stateInstance }
    : {
        status: "error",
        message: "GREEN-API вернул неожиданный ответ. Повторите попытку позже.",
      };
}

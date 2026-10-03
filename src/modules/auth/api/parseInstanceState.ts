import type { InstanceState } from "../../../shared/api/green-api/types";
import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";

export function parseInstanceState(body: string): InstanceState | null {
  try {
    const data = asJsonObject(parseJson(body));
    if (!data) return null;

    switch (data.stateInstance) {
      case "authorized":
      case "notAuthorized":
      case "blocked":
      case "starting":
      case "suspended":
      case "pendingPassword":
        return data.stateInstance;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

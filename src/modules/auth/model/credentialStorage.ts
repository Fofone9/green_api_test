import { asJsonObject, parseJson } from "../../../shared/api/green-api/json.ts";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import {
  readStorage,
  removeStorage,
  writeStorage,
} from "../../../shared/storage/browserStorage.ts";
import {
  normalizeCredentials,
  validateCredentials,
} from "./validateCredentials.ts";

const CREDENTIALS_KEY = "telegram-chat:credentials:v1";

export function loadCredentials(): GreenApiCredentials | null {
  const body = readStorage(CREDENTIALS_KEY);
  if (!body) return null;
  const data = asJsonObject(parseJson(body));
  if (
    data?.version !== 1 ||
    typeof data.idInstance !== "string" ||
    typeof data.apiTokenInstance !== "string"
  )
    return null;
  const credentials = normalizeCredentials({
    idInstance: data.idInstance,
    apiTokenInstance: data.apiTokenInstance,
  });
  return Object.values(validateCredentials(credentials)).some(Boolean)
    ? null
    : credentials;
}

export function saveCredentials(credentials: GreenApiCredentials): boolean {
  return writeStorage(
    CREDENTIALS_KEY,
    JSON.stringify({ version: 1, ...credentials }),
  );
}

export function clearCredentials(): boolean {
  return removeStorage(CREDENTIALS_KEY);
}

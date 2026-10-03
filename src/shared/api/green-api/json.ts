export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export function asJsonObject(value: JsonValue | undefined): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

export function parseJson(body: string): JsonValue | undefined {
  try {
    const value: JsonValue = JSON.parse(body);
    return value;
  } catch {
    return undefined;
  }
}

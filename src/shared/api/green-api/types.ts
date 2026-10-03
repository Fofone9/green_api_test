export interface GreenApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
}

export type ApiResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string }
  | { status: "cancelled" };

export type InstanceState =
  | "authorized"
  | "notAuthorized"
  | "blocked"
  | "starting"
  | "suspended"
  | "pendingPassword";

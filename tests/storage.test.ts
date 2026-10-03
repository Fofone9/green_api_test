import assert from "node:assert/strict";
import test from "node:test";
import type { TestContext } from "node:test";
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from "../src/modules/auth/model/credentialStorage.ts";
import {
  loadChatState,
  saveChatState,
} from "../src/modules/chat/model/chatStorage.ts";
import { parseSavedChat } from "../src/modules/chat/model/parseSavedChat.ts";
import {
  chatReducer,
  initialChatState,
} from "../src/modules/chat/model/chatReducer.ts";
import type { ChatState } from "../src/modules/chat/model/chatReducer.ts";
import { pendingStatusMessages } from "../src/modules/chat/model/syncMessageStatuses.ts";
import {
  readStorage,
  removeStorage,
  writeStorage,
} from "../src/shared/storage/browserStorage.ts";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function installStorage(context: TestContext): MemoryStorage {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return storage;
}

const credentials = {
  idInstance: "4100000001",
  apiTokenInstance: "test-token",
};
const state: ChatState = {
  activeId: "123456",
  conversations: [
    {
      id: "123456",
      title: "Анна",
      phone: "79991234567",
      unread: 0,
      messages: [
        {
          id: "incoming-1",
          chatId: "123456",
          text: "Привет\nответ",
          timestamp: 1791000000,
          direction: "incoming",
          status: "delivered",
        },
        {
          id: "outgoing-1",
          chatId: "123456",
          text: "Сообщение",
          timestamp: 1791000001,
          direction: "outgoing",
          status: "queued",
        },
      ],
    },
  ],
  statuses: { "123456:early-status": "read" },
};

test("восстанавливает авторизацию и полное состояние чата после чтения из хранилища", (context) => {
  installStorage(context);
  assert.equal(saveCredentials(credentials), true);
  assert.equal(saveChatState(credentials.idInstance, state), true);
  assert.deepEqual(loadCredentials(), credentials);
  assert.deepEqual(loadChatState(credentials.idInstance), state);
});

test("истории разных инстансов не смешиваются, токен не входит в ключ истории", (context) => {
  const storage = installStorage(context);
  saveChatState(credentials.idInstance, state);
  saveChatState("4100000002", initialChatState);
  assert.deepEqual(loadChatState(credentials.idInstance), state);
  assert.deepEqual(loadChatState("4100000002"), initialChatState);
  assert.deepEqual(loadChatState("4100000003"), initialChatState);
  for (let index = 0; index < storage.length; index += 1)
    assert.ok(!storage.key(index)?.includes(credentials.apiTokenInstance));
});

test("выход удаляет сохранённый токен и оставляет историю для следующего входа", (context) => {
  installStorage(context);
  saveCredentials(credentials);
  saveChatState(credentials.idInstance, state);
  assert.equal(clearCredentials(), true);
  assert.equal(loadCredentials(), null);
  assert.deepEqual(loadChatState(credentials.idInstance), state);
});

test("отклоняет неверные поля и несовместимую версию сохранённой авторизации", (context) => {
  const storage = installStorage(context);
  saveCredentials(credentials);
  const key = storage.key(0);
  assert.ok(key);
  for (const body of [
    "broken",
    "null",
    "[]",
    JSON.stringify({ version: 2, ...credentials }),
    JSON.stringify({ version: 1, idInstance: "abc", apiTokenInstance: "test" }),
    JSON.stringify({
      version: 1,
      idInstance: "123",
      apiTokenInstance: "with space",
    }),
    JSON.stringify({ version: 1, idInstance: "123", apiTokenInstance: 456 }),
  ]) {
    storage.setItem(key, body);
    assert.equal(loadCredentials(), null);
  }
});

test("повреждённое состояние не ломает чат", (context) => {
  const storage = installStorage(context);
  saveChatState(credentials.idInstance, state);
  const key = storage.key(0);
  assert.ok(key);
  storage.setItem(key, "broken");
  assert.deepEqual(loadChatState(credentials.idInstance), initialChatState);
  for (const body of [
    "null",
    "[]",
    "{}",
    JSON.stringify({ version: 2, state }),
    JSON.stringify({
      version: 1,
      state: { ...state, statuses: { bad: "future-status" } },
    }),
    JSON.stringify({
      version: 1,
      state: {
        ...state,
        conversations: [state.conversations[0], state.conversations[0]],
      },
    }),
  ]) {
    assert.equal(parseSavedChat(body), null);
  }
});

test("не восстанавливает сообщения другого чата и некорректные временные метки", () => {
  const original = state.conversations[0];
  const originalMessage = original.messages[0];
  for (const message of [
    { ...originalMessage, chatId: "other" },
    { ...originalMessage, timestamp: 1e20 },
    { ...originalMessage, direction: "future" },
    { ...originalMessage, status: "future" },
  ]) {
    const saved = {
      ...state,
      conversations: [{ ...original, messages: [message] }],
    };
    assert.equal(
      parseSavedChat(JSON.stringify({ version: 1, state: saved })),
      null,
    );
  }
});

test("сбрасывает выбор отсутствующего чата, сохраняя переписку", () => {
  const restored = parseSavedChat(
    JSON.stringify({ version: 1, state: { ...state, activeId: "missing" } }),
  );
  assert.equal(restored?.activeId, null);
  assert.deepEqual(restored?.conversations, state.conversations);
});

test("после восстановления продолжает сверку статусов без дублирования сообщений", (context) => {
  installStorage(context);
  saveChatState(credentials.idInstance, state);
  let restored = loadChatState(credentials.idInstance);
  assert.deepEqual(
    pendingStatusMessages(restored.conversations).map((item) => item.id),
    ["outgoing-1"],
  );
  restored = chatReducer(restored, {
    type: "event",
    event: {
      type: "message",
      title: "Анна",
      phone: "79991234567",
      message: state.conversations[0].messages[0],
    },
  });
  assert.equal(restored.conversations[0].messages.length, 2);
  restored = chatReducer(restored, {
    type: "event",
    event: {
      type: "status",
      chatId: "123456",
      idMessage: "outgoing-1",
      status: "read",
    },
  });
  saveChatState(credentials.idInstance, restored);
  assert.equal(
    loadChatState(credentials.idInstance).conversations[0].messages[1].status,
    "read",
  );
});

test("запрет хранилища и превышение квоты не выбрасывают ошибки в приложение", (context) => {
  const storage = installStorage(context);
  context.mock.method(storage, "setItem", () => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  context.mock.method(storage, "getItem", () => {
    throw new DOMException("Blocked", "SecurityError");
  });
  context.mock.method(storage, "removeItem", () => {
    throw new DOMException("Blocked", "SecurityError");
  });
  assert.equal(readStorage("key"), null);
  assert.equal(writeStorage("key", "value"), false);
  assert.equal(removeStorage("key"), false);
  assert.equal(saveCredentials(credentials), false);
  assert.equal(saveChatState(credentials.idInstance, state), false);
  assert.deepEqual(loadChatState(credentials.idInstance), initialChatState);
});

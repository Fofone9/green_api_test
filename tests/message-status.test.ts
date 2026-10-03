import assert from "node:assert/strict";
import test from "node:test";
import { getMessageStatus } from "../src/modules/chat/api/getMessageStatus.ts";
import {
  pendingStatusMessages,
  syncMessageStatuses,
} from "../src/modules/chat/model/syncMessageStatuses.ts";
import {
  chatReducer,
  initialChatState,
} from "../src/modules/chat/model/chatReducer.ts";
import { parseNotification } from "../src/modules/chat/api/parseNotification.ts";
import type {
  ChatMessage,
  DeliveryStatus,
} from "../src/modules/chat/model/types.ts";

const credentials = {
  idInstance: "4100000001",
  apiTokenInstance: "test-token",
};
const message: ChatMessage = {
  id: "message-1",
  chatId: "123456",
  text: "Привет",
  timestamp: 1791000000,
  direction: "outgoing",
  status: "queued",
};
const signal = () => new AbortController().signal;
const response = (statusMessage: string) =>
  JSON.stringify({
    type: "outgoing",
    idMessage: message.id,
    chatId: message.chatId,
    statusMessage,
  });

test("сверяет статус POST-запросом GetMessage с ID конкретного сообщения", async (context) => {
  const requests: Request[] = [];
  context.mock.method(
    globalThis,
    "fetch",
    (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(new Request(input, init));
      return Promise.resolve(new Response(response("read")));
    },
  );
  assert.deepEqual(
    await getMessageStatus(credentials, message.chatId, message.id, signal()),
    { status: "success", data: "read" },
  );
  assert.equal(requests[0].method, "POST");
  assert.ok(requests[0].url.endsWith("/getMessage/test-token"));
  assert.deepEqual(await requests[0].json(), {
    chatId: message.chatId,
    idMessage: message.id,
  });
});

test("без уведомлений обновляет очередь до доставки и прочтения, затем прекращает проверки", async (context) => {
  let status = "delivered";
  context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(new Response(response(status))),
  );
  let state = chatReducer(initialChatState, {
    type: "event",
    event: { type: "message", message, title: "Анна", phone: "" },
  });
  for (const nextStatus of ["delivered", "read"]) {
    status = nextStatus;
    const result = await syncMessageStatuses(
      credentials,
      pendingStatusMessages(state.conversations),
      (event) => {
        state = chatReducer(state, { type: "event", event });
      },
      signal(),
    );
    assert.equal(result.status, "success");
    assert.equal(state.conversations[0].messages[0].status, nextStatus);
    assert.equal(state.conversations[0].messages.length, 1);
  }
  assert.deepEqual(pendingStatusMessages(state.conversations), []);
});

test("запоздавший ответ опроса не понижает статус после уведомления о прочтении", async (context) => {
  context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(new Response(response("delivered"))),
  );
  let state = chatReducer(initialChatState, {
    type: "event",
    event: { type: "message", message, title: "Анна", phone: "" },
  });
  const snapshot = pendingStatusMessages(state.conversations);
  const notification = parseNotification(
    JSON.stringify({
      receiptId: 1,
      body: {
        typeWebhook: "outgoingMessageStatus",
        chatId: message.chatId,
        idMessage: message.id,
        status: "read",
      },
    }),
  );
  assert.ok(notification?.event);
  state = chatReducer(state, { type: "event", event: notification.event });
  await syncMessageStatuses(
    credentials,
    snapshot,
    (event) => {
      state = chatReducer(state, { type: "event", event });
    },
    signal(),
  );
  assert.equal(state.conversations[0].messages[0].status, "read");
});

test("не подменяет статус ответом о другом сообщении или повреждённым JSON", async (context) => {
  for (const body of [
    "invalid",
    response("future"),
    response("read").replace("message-1", "message-2"),
  ]) {
    const fetchMock = context.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(body)),
    );
    assert.equal(
      (
        await getMessageStatus(
          credentials,
          message.chatId,
          message.id,
          signal(),
        )
      ).status,
      "error",
    );
    fetchMock.mock.restore();
  }
});

test("отсутствующее в журнале сообщение остаётся в очереди без ошибки", async (context) => {
  for (const body of ["null", "{}"]) {
    const fetchMock = context.mock.method(globalThis, "fetch", () =>
      Promise.resolve(new Response(body)),
    );
    assert.deepEqual(
      await getMessageStatus(credentials, message.chatId, message.id, signal()),
      { status: "success", data: null },
    );
    fetchMock.mock.restore();
  }
});

test("входящие, прочитанные и неотправленные сообщения не опрашиваются", () => {
  const statuses: DeliveryStatus[] = [
    "queued",
    "sent",
    "delivered",
    "read",
    "failed",
    "noAccount",
  ];
  const messages: ChatMessage[] = statuses.map((status) => ({
    ...message,
    id: status,
    status,
  }));
  messages.push({ ...message, id: "incoming", direction: "incoming" });
  const pending = pendingStatusMessages([
    { id: message.chatId, title: "Анна", phone: "", unread: 0, messages },
  ]);
  assert.deepEqual(
    pending.map((item) => item.id),
    ["queued", "sent", "delivered"],
  );
});

test("после выхода опрос не делает запросов и не обновляет состояние", async (context) => {
  const fetchMock = context.mock.method(globalThis, "fetch", () =>
    Promise.reject(new Error("Не должен вызываться")),
  );
  const controller = new AbortController();
  controller.abort();
  assert.deepEqual(
    await syncMessageStatuses(
      credentials,
      [message],
      () => assert.fail("Состояние изменено после выхода"),
      controller.signal,
    ),
    { status: "cancelled" },
  );
  assert.equal(fetchMock.mock.callCount(), 0);
});

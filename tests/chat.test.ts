import assert from 'node:assert/strict'
import test from 'node:test'
import { checkAccount } from '../src/modules/chat/api/checkAccount.ts'
import { sendTextMessage } from '../src/modules/chat/api/sendTextMessage.ts'
import { checkNotificationSettings, deleteNotification } from '../src/modules/chat/api/notifications.ts'
import { parseNotification } from '../src/modules/chat/api/parseNotification.ts'
import { chatReducer, initialChatState } from '../src/modules/chat/model/chatReducer.ts'
import { waitForPoll } from '../src/modules/chat/model/waitForPoll.ts'
import { normalizePhone, isValidPhone } from '../src/modules/chat/model/phone.ts'
import type { ChatEvent } from '../src/modules/chat/model/types.ts'

const credentials = { idInstance: '4100000001', apiTokenInstance: 'test-token' }
const signal = () => new AbortController().signal
const webhook = {
  typeWebhook: 'incomingMessageReceived', idMessage: 'message-1', timestamp: 1791000000,
  senderData: { chatId: '123456', chatType: 'user', chatName: 'Анна', senderPhoneNumber: 79991234567 },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет\n<script>text</script>' } },
}
const incoming: ChatEvent = { type: 'message', title: 'Анна', phone: '79991234567',
  message: { id: 'message-1', chatId: '123456', text: 'Ответ', timestamp: 1791000000, direction: 'incoming', status: 'delivered' } }

test('нормализует международный телефон и отклоняет неверный номер', () => {
  assert.equal(normalizePhone('+7 (999) 123-45-67'), '79991234567')
  assert.equal(isValidPhone('79991234567'), true)
  for (const phone of ['0123456789', '123', 'abc', '1234567890123456']) assert.equal(isValidPhone(phone), false)
})

test('определяет chatId Telegram по номеру вместо подстановки телефона в ID', async (context) => {
  const requests: Request[] = []
  context.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    return Promise.resolve(new Response('{"exist":true,"chatId":"123456"}'))
  })
  assert.deepEqual(await checkAccount(credentials, '79991234567', signal()), { status: 'success', data: '123456' })
  assert.equal(requests[0].method, 'POST')
  assert.deepEqual(await requests[0].json(), { phoneNumber: 79991234567 })
})

test('не создаёт чат для отсутствующего или скрытого аккаунта', async (context) => {
  context.mock.method(globalThis, 'fetch', () => Promise.resolve(new Response('{"exist":false}')))
  assert.equal((await checkAccount(credentials, '79991234567', signal())).status, 'error')
})

test('отправляет только текст, сохраняя переносы и пробелы', async (context) => {
  const requests: Request[] = []
  context.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    return Promise.resolve(new Response('{"idMessage":"sent-1"}'))
  })
  assert.deepEqual(await sendTextMessage(credentials, '123456', ' Текст\nответ ', signal()), { status: 'success', data: 'sent-1' })
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].headers.get('Content-Type'), 'application/json')
  assert.deepEqual(await requests[0].json(), { chatId: '123456', message: ' Текст\nответ ' })
})

test('не отправляет пустые и слишком длинные сообщения', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', () => Promise.reject(new Error('Не должен вызываться')))
  for (const text of ['  \n', 'a'.repeat(4097)]) assert.equal((await sendTextMessage(credentials, '123456', text, signal())).status, 'error')
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('разбирает входящий текст с каноническим ID чата', () => {
  const parsed = parseNotification(JSON.stringify({ receiptId: 77, body: webhook }))
  assert.equal(parsed?.receiptId, 77)
  assert.equal(parsed?.event?.type, 'message')
  if (parsed?.event?.type === 'message') {
    assert.equal(parsed.event.message.chatId, '123456')
    assert.equal(parsed.event.message.text, 'Привет\n<script>text</script>')
    assert.equal(parsed.event.message.direction, 'incoming')
  }
})

test('оставляет текст ссылок, игнорирует файлы и не блокирует их подтверждение', () => {
  const extended = { ...webhook, messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'https://example.com' } } }
  const parsed = parseNotification(JSON.stringify({ receiptId: 77, body: extended }))
  assert.equal(parsed?.event?.type, 'message')
  if (parsed?.event?.type === 'message') assert.equal(parsed.event.message.text, 'https://example.com')
  const media = { ...webhook, messageData: { typeMessage: 'imageMessage' } }
  assert.deepEqual(parseNotification(JSON.stringify({ receiptId: 78, body: media })), { receiptId: 78, event: null })
})

test('отличает пустую очередь от повреждённого ответа и отбрасывает неверное время', () => {
  assert.equal(parseNotification('null'), null)
  assert.equal(parseNotification(''), null)
  for (const body of ['bad', '{}', '{"receiptId":-1,"body":{}}']) assert.equal(parseNotification(body), undefined)
  assert.equal(parseNotification(JSON.stringify({ receiptId: 77, body: { ...webhook, timestamp: 1e20 } }))?.event, null)
})

test('подтверждает уведомление DELETE-запросом с receiptId в URL', async (context) => {
  const requests: Request[] = []
  context.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    return Promise.resolve(new Response('{"result":true}'))
  })
  assert.deepEqual(await deleteNotification(credentials, 77, signal()), { status: 'success', data: true })
  assert.equal(requests[0].method, 'DELETE')
  assert.ok(requests[0].url.endsWith('/deleteNotification/test-token/77'))
})

test('проверяет настройки получения, не меняя существующий Webhook URL', async (context) => {
  for (const settings of [
    { incomingWebhook: 'yes', webhookUrl: '', expected: 'success' },
    { incomingWebhook: 'no', webhookUrl: '', expected: 'error' },
    { incomingWebhook: 'yes', webhookUrl: 'https://example.com/hook', expected: 'error' },
  ]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(new Request(input, init).method, 'GET')
      return Promise.resolve(new Response(JSON.stringify(settings)))
    })
    assert.equal((await checkNotificationSettings(credentials, signal())).status, settings.expected)
    fetchMock.mock.restore()
  }
})

test('повторное уведомление не дублирует сообщение и счётчик непрочитанных', () => {
  const first = chatReducer(initialChatState, { type: 'event', event: incoming })
  const second = chatReducer(first, { type: 'event', event: incoming })
  assert.equal(second.conversations[0].messages.length, 1)
  assert.equal(second.conversations[0].unread, 1)
  const opened = chatReducer(second, { type: 'open', chatId: '123456', phone: '79991234567' })
  assert.equal(opened.conversations.length, 1)
  assert.equal(opened.conversations[0].unread, 0)
  assert.equal(opened.activeId, '123456')
})

test('ранний статус сохраняется и не понижается поздним событием отправки', () => {
  const status = chatReducer(initialChatState, { type: 'event', event: { type: 'status', chatId: '123456', idMessage: 'sent-1', status: 'read' } })
  const outgoing: ChatEvent = { ...incoming, message: { ...incoming.message, id: 'sent-1', direction: 'outgoing', status: 'queued' } }
  const sent = chatReducer(status, { type: 'event', event: outgoing })
  const delivered = chatReducer(sent, { type: 'event', event: { type: 'status', chatId: '123456', idMessage: 'sent-1', status: 'delivered' } })
  assert.equal(delivered.conversations[0].messages[0].status, 'read')
})

test('статус без ID не назначается произвольному сообщению', () => {
  const outgoing: ChatEvent = { ...incoming, message: { ...incoming.message, direction: 'outgoing', status: 'queued' } }
  const first = chatReducer(initialChatState, { type: 'event', event: outgoing })
  const second = chatReducer(first, { type: 'event', event: { ...outgoing, message: { ...outgoing.message, id: 'message-2' } } })
  const failed = chatReducer(second, { type: 'event', event: { type: 'status', chatId: '123456', idMessage: null, status: 'failed' } })
  assert.equal(failed, second)
})

test('выход немедленно отменяет ожидание следующего опроса', async () => {
  const controller = new AbortController()
  const pending = waitForPoll(60_000, controller.signal)
  controller.abort()
  await pending
  await waitForPoll(60_000, controller.signal)
})

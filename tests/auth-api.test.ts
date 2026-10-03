import assert from 'node:assert/strict'
import test from 'node:test'
import { getStateInstance } from '../src/modules/auth/api/getStateInstance.ts'
import { parseInstanceState } from '../src/modules/auth/api/parseInstanceState.ts'
import { GREEN_API_URL } from '../src/shared/api/green-api/config.ts'

const credentials = { idInstance: '3000000001', apiTokenInstance: 'test-token' }

test('принимает все документированные состояния инстанса', () => {
  for (const state of ['authorized', 'notAuthorized', 'blocked', 'starting', 'suspended', 'pendingPassword']) {
    assert.equal(parseInstanceState(JSON.stringify({ stateInstance: state })), state)
  }
})

test('отклоняет повреждённые и неожиданные ответы вместо успешного подключения', () => {
  for (const body of ['invalid', 'null', '[]', '{}', '"authorized"', '{"stateInstance":true}', '{"stateInstance":"future-state"}']) {
    assert.equal(parseInstanceState(body), null)
  }
})

test('проверяет инстанс GET-запросом на сервер из константы и кодирует токен', async (context) => {
  const requests: Request[] = []
  context.mock.method(globalThis, 'fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    return Promise.resolve(new Response('{"stateInstance":"authorized"}'))
  })
  const result = await getStateInstance({ ...credentials, apiTokenInstance: 'test/token?#' }, new AbortController().signal)
  assert.deepEqual(result, { status: 'success', stateInstance: 'authorized' })
  assert.equal(requests.length, 1)
  const sentRequest = requests[0]
  assert.ok(sentRequest)
  assert.equal(sentRequest.url, `${GREEN_API_URL}/waInstance3000000001/getStateInstance/test%2Ftoken%3F%23`)
  assert.equal(sentRequest.method, 'GET')
  assert.equal(sentRequest.cache, 'no-store')
  assert.equal(sentRequest.credentials, 'omit')
})

test('сохраняет неавторизованное состояние, не превращая HTTP 200 в успешный вход', async (context) => {
  context.mock.method(globalThis, 'fetch', () => Promise.resolve(new Response('{"stateInstance":"notAuthorized"}')))
  assert.deepEqual(await getStateInstance(credentials, new AbortController().signal), {
    status: 'success', stateInstance: 'notAuthorized',
  })
})

test('возвращает понятные ошибки HTTP без содержимого ответа и токена', async (context) => {
  for (const status of [400, 401, 403, 404, 429, 502]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', () => Promise.resolve(new Response('private server body', { status })))
    const result = await getStateInstance(credentials, new AbortController().signal)
    assert.equal(result.status, 'error')
    if (result.status === 'error') {
      assert.ok(result.message.length > 0)
      assert.ok(!result.message.includes('private server body'))
      assert.ok(!result.message.includes(credentials.apiTokenInstance))
    }
    fetchMock.mock.restore()
  }
})

test('повреждённый ответ API отображается как ошибка', async (context) => {
  context.mock.method(globalThis, 'fetch', () => Promise.resolve(new Response('<html>error</html>')))
  const result = await getStateInstance(credentials, new AbortController().signal)
  assert.equal(result.status, 'error')
})

test('обрабатывает сетевую ошибку без отклонённого Promise', async (context) => {
  context.mock.method(globalThis, 'fetch', () => Promise.reject(new TypeError('Failed to fetch')))
  const result = await getStateInstance(credentials, new AbortController().signal)
  assert.equal(result.status, 'error')
})

test('отмена запроса не показывается как ошибка подключения', async (context) => {
  context.mock.method(globalThis, 'fetch', () => Promise.reject(new DOMException('Aborted', 'AbortError')))
  const controller = new AbortController()
  controller.abort()
  assert.deepEqual(await getStateInstance(credentials, controller.signal), { status: 'cancelled' })
})

test('таймаут предлагает повторить попытку', async (context) => {
  const controller = new AbortController()
  controller.abort()
  context.mock.method(AbortSignal, 'timeout', () => controller.signal)
  context.mock.method(globalThis, 'fetch', () => Promise.reject(new DOMException('Timed out', 'TimeoutError')))
  const result = await getStateInstance(credentials, new AbortController().signal)
  assert.equal(result.status, 'error')
  if (result.status === 'error') assert.match(result.message, /не ответил вовремя/)
})

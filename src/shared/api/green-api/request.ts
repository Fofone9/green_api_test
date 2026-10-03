import { GREEN_API_REQUEST_OPTIONS, GREEN_API_TIMEOUT_MS, GREEN_API_URL } from './config.ts'
import { getHttpError } from './httpErrors.ts'
import type { GreenApiCredentials } from './types'

interface GreenApiRequest {
  credentials: GreenApiCredentials
  apiMethod: string
  signal: AbortSignal
  method?: 'GET' | 'POST' | 'DELETE'
  body?: string
  timeoutMs?: number
}

type RequestResult =
  | { status: 'success'; body: string }
  | { status: 'error'; message: string }
  | { status: 'cancelled' }

export async function requestGreenApi({
  credentials, apiMethod, signal, method = 'GET', body, timeoutMs = GREEN_API_TIMEOUT_MS,
}: GreenApiRequest): Promise<RequestResult> {
  const timeout = AbortSignal.timeout(timeoutMs)
  const requestSignal = AbortSignal.any([signal, timeout])
  const { idInstance, apiTokenInstance } = credentials
  const url = `${GREEN_API_URL}/waInstance${encodeURIComponent(idInstance)}/${encodeURIComponent(apiMethod)}/${encodeURIComponent(apiTokenInstance)}`

  try {
    const response = await fetch(url, {
      ...GREEN_API_REQUEST_OPTIONS,
      method,
      signal: requestSignal,
      body,
      headers: {
        ...GREEN_API_REQUEST_OPTIONS.headers,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
    })
    if (!response.ok) return { status: 'error', message: getHttpError(response.status) }
    return { status: 'success', body: await response.text() }
  } catch {
    if (signal.aborted) return { status: 'cancelled' }
    return {
      status: 'error',
      message: timeout.aborted
        ? 'Сервер не ответил вовремя. Повторите попытку.'
        : 'Не удалось связаться с GREEN-API. Проверьте интернет и повторите попытку.',
    }
  }
}

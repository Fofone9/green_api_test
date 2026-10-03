// Адрес сервера MAX из личного кабинета GREEN-API.
export const GREEN_API_URL = 'https://3100.api.green-api.com'

export const GREEN_API_TIMEOUT_MS = 15_000

export const GREEN_API_REQUEST_OPTIONS = {
  cache: 'no-store',
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
  headers: { Accept: 'application/json' },
} satisfies RequestInit

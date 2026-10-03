import { useEffect, useRef, useState } from 'react'
import type { GreenApiCredentials, InstanceState } from '../../../shared/api/green-api/types'
import { getStateInstance } from '../api/getStateInstance'

type AuthorizationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'connected'; credentials: GreenApiCredentials }

const instanceMessages: Record<Exclude<InstanceState, 'authorized'>, string> = {
  notAuthorized: 'Инстанс не авторизован в Telegram. Подключите его в личном кабинете GREEN-API и повторите попытку.',
  blocked: 'Аккаунт Telegram заблокирован. Проверьте его состояние в личном кабинете GREEN-API.',
  starting: 'Инстанс запускается. Подождите несколько минут и повторите попытку.',
  suspended: 'На аккаунте Telegram действуют ограничения. Проверьте их в личном кабинете GREEN-API.',
  pendingPassword: 'Завершите двухфакторную авторизацию инстанса в личном кабинете GREEN-API.',
}

export function useAuthorization() {
  const [state, setState] = useState<AuthorizationState>({ status: 'idle' })
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(() => () => activeRequest.current?.abort(), [])

  async function connect(credentials: GreenApiCredentials) {
    if (activeRequest.current) return
    const controller = new AbortController()
    activeRequest.current = controller
    setState({ status: 'loading' })

    const result = await getStateInstance(credentials, controller.signal)
    if (controller.signal.aborted) return
    activeRequest.current = null

    if (result.status === 'error') setState({ status: 'error', message: result.message })
    else if (result.status === 'success') {
      setState(result.stateInstance === 'authorized'
        ? { status: 'connected', credentials }
        : { status: 'error', message: instanceMessages[result.stateInstance] })
    }
  }

  function clearError() {
    setState((current) => current.status === 'error' ? { status: 'idle' } : current)
  }

  function disconnect() {
    activeRequest.current?.abort()
    activeRequest.current = null
    setState({ status: 'idle' })
  }

  return { state, connect, clearError, disconnect }
}

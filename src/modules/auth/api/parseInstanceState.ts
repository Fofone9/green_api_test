import type { InstanceState } from '../../../shared/api/green-api/types'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export function parseInstanceState(body: string): InstanceState | null {
  try {
    const data: JsonValue = JSON.parse(body)
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return null

    switch (data.stateInstance) {
      case 'authorized':
      case 'notAuthorized':
      case 'blocked':
      case 'starting':
      case 'suspended':
      case 'pendingPassword':
        return data.stateInstance
      default:
        return null
    }
  } catch {
    return null
  }
}

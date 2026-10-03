import type { GreenApiCredentials } from '../../../shared/api/green-api/types'

export type CredentialErrors = Record<keyof GreenApiCredentials, string>

export const emptyCredentialErrors: CredentialErrors = {
  idInstance: '',
  apiTokenInstance: '',
}

export function normalizeCredentials(values: GreenApiCredentials): GreenApiCredentials {
  return {
    idInstance: values.idInstance.trim(),
    apiTokenInstance: values.apiTokenInstance.trim(),
  }
}

export function validateCredentials(values: GreenApiCredentials): CredentialErrors {
  const errors = { ...emptyCredentialErrors }

  if (!values.idInstance) errors.idInstance = 'Введите ID инстанса.'
  else if (!/^\d+$/.test(values.idInstance)) errors.idInstance = 'ID инстанса должен содержать только цифры.'

  if (!values.apiTokenInstance) errors.apiTokenInstance = 'Введите токен доступа.'
  else if (/\s/.test(values.apiTokenInstance)) errors.apiTokenInstance = 'Токен не должен содержать пробелы.'

  return errors
}

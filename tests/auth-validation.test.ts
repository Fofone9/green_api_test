import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeCredentials, validateCredentials } from '../src/modules/auth/model/validateCredentials.ts'

test('пустые поля получают отдельные ошибки', () => {
  const errors = validateCredentials({ idInstance: '', apiTokenInstance: '' })
  assert.ok(errors.idInstance)
  assert.ok(errors.apiTokenInstance)
})

test('буквы в ID и пробелы внутри токена не принимаются', () => {
  const errors = validateCredentials({ idInstance: '4100abc', apiTokenInstance: 'test token' })
  assert.ok(errors.idInstance)
  assert.ok(errors.apiTokenInstance)
})

test('пробелы при копировании удаляются, числовой ID и непустой токен принимаются', () => {
  const credentials = normalizeCredentials({ idInstance: ' 4100000001 ', apiTokenInstance: ' test-token\n' })
  assert.deepEqual(credentials, { idInstance: '4100000001', apiTokenInstance: 'test-token' })
  assert.deepEqual(validateCredentials(credentials), { idInstance: '', apiTokenInstance: '' })
})

import type { GreenApiCredentials } from '../../../shared/api/green-api/types'
import { Button } from '../../../shared/ui/Button/Button'
import { TextField } from '../../../shared/ui/TextField/TextField'
import { useAuthForm } from '../model/useAuthForm'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  isLoading: boolean
  error: string
  onConnect: (credentials: GreenApiCredentials) => Promise<void>
  onEdit: () => void
}

export function AuthForm({ isLoading, error, onConnect, onEdit }: AuthFormProps) {
  const { values, errors, updateField, handleSubmit } = useAuthForm({ isLoading, onConnect, onEdit })

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
      <fieldset className={styles.fields} disabled={isLoading}>
        <legend className={styles.legend}>Данные подключения</legend>
        <TextField
          label="ID инстанса" name="idInstance" placeholder="idInstance"
          value={values.idInstance} onChange={(event) => updateField('idInstance', event.target.value)}
          inputMode="numeric" autoComplete="off" required error={errors.idInstance}
        />
        <TextField
          label="Токен доступа" name="apiTokenInstance" placeholder="apiTokenInstance" type="password"
          value={values.apiTokenInstance} onChange={(event) => updateField('apiTokenInstance', event.target.value)}
          autoComplete="off" spellCheck={false} required error={errors.apiTokenInstance}
        />
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Button type="submit" disabled={isLoading}>{isLoading ? 'Подключаемся…' : 'Подключиться'}</Button>
      {isLoading && <span className={styles.loading} role="status">Проверяем подключение к MAX…</span>}
      <a className={styles.link} href="https://console.green-api.com/" target="_blank" rel="noreferrer">
        Открыть личный кабинет GREEN-API ↗
      </a>
    </form>
  )
}

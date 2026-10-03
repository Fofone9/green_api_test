import type { GreenApiCredentials } from '../../../shared/api/green-api/types'
import { Button } from '../../../shared/ui/Button/Button'
import { TextField } from '../../../shared/ui/TextField/TextField'
import { useNewChat } from '../model/useNewChat'
import type { Conversation } from '../model/types'
import styles from './NewChatForm.module.css'

interface NewChatFormProps {
  credentials: GreenApiCredentials
  conversations: Conversation[]
  onOpen: (chatId: string, phone: string) => void
}

export function NewChatForm({ credentials, conversations, onOpen }: NewChatFormProps) {
  const { phone, error, isLoading, updatePhone, submit } = useNewChat(credentials, conversations, onOpen)
  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={isLoading}>
      <TextField label="Номер получателя" name="phone" type="tel" autoComplete="tel" placeholder="+7 999 123-45-67"
        value={phone} onChange={(event) => updatePhone(event.target.value)} error={error} disabled={isLoading} required autoFocus />
      <Button type="submit" disabled={isLoading}>{isLoading ? 'Ищем получателя…' : 'Открыть чат'}</Button>
    </form>
  )
}

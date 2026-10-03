import { useId } from 'react'
import { Button } from '../../../shared/ui/Button/Button'
import { MAX_MESSAGE_LENGTH } from '../api/sendTextMessage'
import { useMessageComposer } from '../model/useMessageComposer'
import styles from './MessageComposer.module.css'

interface MessageComposerProps { isSending: boolean; error: string; onSend: (text: string) => Promise<boolean> }

export function MessageComposer({ isSending, error, onSend }: MessageComposerProps) {
  const inputId = useId()
  const { text, setText, canSend, submit, keyDown } = useMessageComposer(isSending, onSend)
  return (
    <form className={styles.form} onSubmit={submit} aria-busy={isSending}>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.controls}>
        <label htmlFor={inputId} className={styles.label}>Сообщение</label>
        <textarea id={inputId} rows={2} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={keyDown}
          placeholder="Сообщение" maxLength={MAX_MESSAGE_LENGTH} disabled={isSending} />
        <Button className={styles.send} type="submit" disabled={!canSend}>{isSending ? 'Отправляем…' : 'Отправить'}</Button>
      </div>
      <p className={styles.hint}>Enter — отправить · Shift + Enter — новая строка</p>
    </form>
  )
}

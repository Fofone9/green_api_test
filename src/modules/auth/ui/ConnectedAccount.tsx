import { Button } from '../../../shared/ui/Button/Button'
import styles from './ConnectedAccount.module.css'

interface ConnectedAccountProps {
  idInstance: string
  onDisconnect: () => void
}

export function ConnectedAccount({ idInstance, onDisconnect }: ConnectedAccountProps) {
  return (
    <div className={styles.content}>
      <span className={styles.mark} aria-hidden="true">✓</span>
      <h1 id="auth-title" className={styles.title}>Вы подключены</h1>
      <p className={styles.description} role="status">Инстанс {idInstance} авторизован в Telegram.</p>
      <Button onClick={onDisconnect}>Сменить инстанс</Button>
    </div>
  )
}

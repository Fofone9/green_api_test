import styles from './AuthHeader.module.css'
import { TelegramMark } from '../../../shared/ui/TelegramMark/TelegramMark'

export function AuthHeader() {
  return (
    <header className={styles.header}>
      <TelegramMark />
      <h1 id="auth-title" className={styles.title}>Вход в Telegram</h1>
      <p className={styles.description}>Введите данные инстанса Telegram из личного кабинета GREEN-API.</p>
    </header>
  )
}

import type { Conversation } from '../model/types'
import styles from './ConversationHeader.module.css'

export function ConversationHeader({ chat, onBack }: { chat: Conversation; onBack: () => void }) {
  return (
    <header className={styles.header}>
      <button className={styles.back} type="button" onClick={onBack} aria-label="Назад к списку чатов">←</button>
      <div><h2>{chat.title}</h2><p>{chat.phone ? `+${chat.phone}` : 'Telegram'}</p></div>
    </header>
  )
}

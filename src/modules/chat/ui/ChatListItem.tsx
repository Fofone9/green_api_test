import type { Conversation } from '../model/types'
import styles from './ChatListItem.module.css'

interface ChatListItemProps { chat: Conversation; isActive: boolean; onSelect: (chatId: string) => void }

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const lastMessage = chat.messages.at(-1)
  return (
    <button className={`${styles.item} ${isActive ? styles.active : ''}`} type="button" aria-current={isActive ? 'true' : undefined} onClick={() => onSelect(chat.id)}>
      <span className={styles.avatar} aria-hidden="true">{chat.title.replace(/^\+/, '').slice(0, 2)}</span>
      <span className={styles.details}><strong>{chat.title}</strong><span>{lastMessage?.text ?? 'Нет сообщений'}</span></span>
      {chat.unread > 0 && <span className={styles.unread} aria-label={`${chat.unread} непрочитанных`}>{chat.unread}</span>}
    </button>
  )
}

import type { ChatMessage, DeliveryStatus } from '../model/types'
import styles from './MessageBubble.module.css'

const statusLabels: Record<DeliveryStatus, string> = {
  queued: 'В очереди', sent: 'Отправлено', delivered: 'Доставлено', read: 'Прочитано', failed: 'Не доставлено', noAccount: 'Получатель недоступен',
}
const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function MessageBubble({ message }: { message: ChatMessage }) {
  const date = new Date(message.timestamp * 1000)
  const outgoing = message.direction === 'outgoing'
  const failed = message.status === 'failed' || message.status === 'noAccount'
  return (
    <article className={`${styles.bubble} ${outgoing ? styles.outgoing : styles.incoming}`}>
      <p>{message.text}</p>
      <footer className={styles.meta}>
        <time dateTime={date.toISOString()} title={date.toLocaleString('ru-RU')}>{timeFormat.format(date)}</time>
        {outgoing && <span className={failed ? styles.failed : ''}>{statusLabels[message.status]}</span>}
      </footer>
    </article>
  )
}

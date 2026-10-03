import styles from './EmptyChat.module.css'

export function EmptyChat() {
  return <div className={styles.empty}><p>Выберите чат или создайте новый</p></div>
}

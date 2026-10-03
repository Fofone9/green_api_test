import styles from './TelegramMark.module.css'

export function TelegramMark() {
  return (
    <span className={styles.mark} aria-hidden="true">
      <svg className={styles.plane} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.4 3.6 18.2 20c-.2 1-1 1.2-1.8.6l-4.9-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.3c.4-.4-.1-.6-.6-.3L5.8 13.3 1 11.8c-1-.3-1-1 .2-1.4L20 3.1c.9-.3 1.6.2 1.4.5Z" />
      </svg>
    </span>
  )
}

import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">{children}</section>
      <p className={styles.footer}>Текстовые сообщения в Telegram через GREEN-API</p>
    </main>
  )
}

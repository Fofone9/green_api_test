import styles from './AuthHeader.module.css'

export function AuthHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>MAX <span className={styles.provider}>/ GREEN-API</span></span>
      <h1 id="auth-title" className={styles.title}>Подключиться к чату</h1>
      <p className={styles.description}>Введите данные инстанса из личного кабинета GREEN-API.</p>
    </header>
  )
}

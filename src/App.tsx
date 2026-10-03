import styles from "./App.module.css";

function App() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.badge}>GREEN-API · MAX</span>
        <h1 className={styles.title}>Чат MAX</h1>
      </section>
    </main>
  );
}

export default App;

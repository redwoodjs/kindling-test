import styles from "./welcome.module.css";

export const Home = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kindling Test App</h1>
        <p className={styles.subtitle}>
          A multi-page application for testing browser-driven verification.
        </p>
      </header>

      <main>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pages</h2>
          <ol className={styles.list}>
            <li>
              <a href="/about" className={styles.link}>
                About
              </a>{" "}
              — learn about this test application
            </li>
            <li>
              <a href="/contact" className={styles.link}>
                Contact
              </a>{" "}
              — send a message using the form
            </li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>API Endpoints</h2>
          <ol className={styles.list}>
            <li>
              <a href="/health" className={styles.link}>
                /health
              </a>{" "}
              — health check
            </li>
            <li>
              <a href="/ping" className={styles.link}>
                /ping
              </a>{" "}
              — ping/pong
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
};

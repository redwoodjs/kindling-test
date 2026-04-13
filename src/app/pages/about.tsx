import styles from "./welcome.module.css";

export const About = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>About</h1>
        <p className={styles.subtitle}>
          A test application for verifying kindling's browser-driven
          verification pipeline.
        </p>
      </header>

      <main>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What this is</h2>
          <p style={{ fontSize: "1.25rem", lineHeight: 1.6 }}>
            This is a minimal RedwoodSDK application used as a test target for
            kindling's verification system. It provides multiple pages with
            interactive elements that an automated verifier can navigate and
            validate.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pages</h2>
          <ol className={styles.list}>
            <li>
              <a href="/" className={styles.link}>
                Home
              </a>{" "}
              — the landing page with navigation links
            </li>
            <li>
              <a href="/about" className={styles.link}>
                About
              </a>{" "}
              — this page
            </li>
            <li>
              <a href="/contact" className={styles.link}>
                Contact
              </a>{" "}
              — a form with client-side validation
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
};

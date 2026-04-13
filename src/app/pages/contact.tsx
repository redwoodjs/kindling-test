"use client";

import { useState } from "react";
import styles from "./welcome.module.css";

export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get("name") as string).trim();
    const email = (data.get("email") as string).trim();
    const message = (data.get("message") as string).trim();

    const newErrors: Record<string, string> = {};
    if (!name) {
      newErrors.name = "Name is required";
    }
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }
    if (!message) {
      newErrors.message = "Message is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Thank you!</h1>
          <p className={styles.subtitle}>
            Your message has been received. We'll get back to you soon.
          </p>
        </header>
        <main>
          <a href="/" className={styles.link} style={{ fontSize: "1.25rem" }}>
            Back to home
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>
          Send us a message using the form below.
        </p>
      </header>

      <main>
        <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                fontSize: "1.1rem",
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: errors.name ? "2px solid red" : "1px solid #ccc",
                borderRadius: "0.25rem",
                boxSizing: "border-box",
              }}
            />
            {errors.name && (
              <p style={{ color: "red", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "1.1rem",
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: errors.email ? "2px solid red" : "1px solid #ccc",
                borderRadius: "0.25rem",
                boxSizing: "border-box",
              }}
            />
            {errors.email && (
              <p style={{ color: "red", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                {errors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="message"
              style={{
                display: "block",
                fontSize: "1.1rem",
                marginBottom: "0.5rem",
                fontWeight: 600,
              }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="What would you like to say?"
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: errors.message ? "2px solid red" : "1px solid #ccc",
                borderRadius: "0.25rem",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            {errors.message && (
              <p style={{ color: "red", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "#f47238",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            Send Message
          </button>
        </form>

        <p style={{ marginTop: "2rem" }}>
          <a href="/" className={styles.link} style={{ fontSize: "1.1rem" }}>
            Back to home
          </a>
        </p>
      </main>
    </div>
  );
};

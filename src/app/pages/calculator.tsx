"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyClear,
  applyDigit,
  applyEquals,
  applyOperator,
  formatResult,
  initialState,
  type CalcState,
  type Operator,
} from "./calculator.logic.js";
import styles from "./calculator.module.css";

// ─── Component ────────────────────────────────────────────────────────────────

const OPERATORS: { key: string; display: string; ariaLabel: string }[] = [
  { key: "+", display: "+", ariaLabel: "Add" },
  { key: "−", display: "−", ariaLabel: "Subtract" },
  { key: "×", display: "×", ariaLabel: "Multiply" },
  { key: "÷", display: "÷", ariaLabel: "Divide" },
];

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

export function Calculator() {
  const [state, setState] = useState<CalcState>(initialState);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setState((prev) => applyDigit(prev, digit));
  }, []);

  const handleOperator = useCallback((op: string) => {
    setState((prev) => applyOperator(prev, op as Operator));
  }, []);

  const handleEquals = useCallback(() => {
    setState((prev) => applyEquals(prev));
  }, []);

  const handleClear = useCallback(() => {
    setState(() => applyClear());
  }, []);

  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.isError) return applyClear();
      if (prev.resultDisplayed) return prev;
      if (prev.display.length <= 1) {
        return { ...prev, display: "0" };
      }
      return { ...prev, display: prev.display.slice(0, -1) };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((prev) => {
      if (prev.isError) return prev;
      const val = parseFloat(prev.display) / 100;
      return { ...prev, display: formatResult(val) };
    });
  }, []);

  const handleSignToggle = useCallback(() => {
    setState((prev) => {
      if (prev.isError) return prev;
      if (prev.display === "0") return prev;
      const neg = prev.display.startsWith("-")
        ? prev.display.slice(1)
        : "-" + prev.display;
      return { ...prev, display: neg };
    });
  }, []);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const key = e.key;

      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        handleDigit(key);
        return;
      }

      if (key === "+" || key === "-") {
        e.preventDefault();
        handleOperator(key === "+" ? "+" : "−");
        return;
      }

      if (key === "*") {
        e.preventDefault();
        handleOperator("×");
        return;
      }

      if (key === "/") {
        e.preventDefault();
        handleOperator("÷");
        return;
      }

      if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (key === "Escape" || key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
        return;
      }

      if (key === "%") {
        e.preventDefault();
        handlePercent();
        return;
      }

      if (key === "+" && e.shiftKey) {
        e.preventDefault();
        handleSignToggle();
        return;
      }
    },
    [
      handleDigit,
      handleOperator,
      handleEquals,
      handleBackspace,
      handleClear,
      handlePercent,
      handleSignToggle,
    ],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Calculator</h1>
      </header>

      <main className={styles.main}>
        <div
          ref={containerRef}
          className={styles.container}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="application"
          aria-label="Calculator"
        >
          {/* Display */}
          <div className={styles.displayArea} aria-live="polite" role="status">
            <div className={styles.expressionLine}>{state.expression}</div>
            <div className={styles.resultLine}>{state.display}</div>
          </div>

          {/* Button grid */}
          <div className={styles.grid} role="group" aria-label="Calculator buttons">
            {/* Top row: C, backspace, percent, divide */}
            <button
              type="button"
              className={`${styles.btn} ${styles.utility}`}
              onClick={handleClear}
              aria-label="Clear"
            >
              C
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.utility}`}
              onClick={handleBackspace}
              aria-label="Backspace"
            >
              ⌫
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.utility}`}
              onClick={handlePercent}
              aria-label="Percent"
            >
              %
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.operator}`}
              onClick={() => handleOperator("÷")}
              aria-label="Divide"
            >
              ÷
            </button>

            {/* Digit rows */}
            {DIGITS.map((d) => (
              <button
                key={d}
                type="button"
                className={`${styles.btn} ${styles.digit}`}
                onClick={() => handleDigit(d)}
                aria-label={d === "0" ? "Zero" : d}
              >
                {d}
              </button>
            ))}

            {/* Bottom row: sign, zero (double), decimal, equals */}
            <button
              type="button"
              className={`${styles.btn} ${styles.sign}`}
              onClick={handleSignToggle}
              aria-label="Toggle sign"
            >
              +/−
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.digitDouble}`}
              onClick={() => handleDigit("0")}
              aria-label="Zero"
            >
              0
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.decimal}`}
              onClick={() => handleDigit(".")}
              aria-label="Decimal point"
            >
              .
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.equals}`}
              onClick={handleEquals}
              aria-label="Equals"
            >
              =
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
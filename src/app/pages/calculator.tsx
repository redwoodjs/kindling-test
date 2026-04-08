"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./calculator.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Operator = "+" | "−" | "×" | "÷";

export type CalcState = {
  display: string;
  expression: string;
  storedOperand: number | null;
  pendingOperator: Operator | null;
  resultDisplayed: boolean;
  isError: boolean;
};

// ─── Pure calculator logic ───────────────────────────────────────────────────

const MAX_DISPLAY_CHARS = 15;
const MAX_EXPRESSION_CHARS = 30;

export function compute(stored: number, op: Operator, current: number): number {
  switch (op) {
    case "+":
      return stored + current;
    case "−":
      return stored - current;
    case "×":
      return stored * current;
    case "÷":
      return stored / current;
  }
}

export function formatResult(n: number): string {
  if (!isFinite(n)) return "Error";
  if (Math.abs(n) >= 1e10) return n.toExponential(5);
  // Round to 10 significant digits then strip trailing zeros
  const rounded = parseFloat(n.toPrecision(10));
  const fixed = rounded.toString();
  // If it contains a decimal point, strip unnecessary trailing zeros
  if (fixed.includes(".")) {
    return fixed.replace(/\.?0+$/, "");
  }
  return fixed;
}

function isErrorState(n: number): boolean {
  return !isFinite(n);
}

// Apply a digit press, returning the next state (pure, no React)
export function applyDigit(state: CalcState, digit: string): CalcState {
  const raw = digit === "." ? "0." : digit;

  if (state.isError) {
    // Machine is in error state — next digit resets everything
    return {
      display: raw,
      expression: "",
      storedOperand: null,
      pendingOperator: null,
      resultDisplayed: false,
      isError: false,
    };
  }

  if (state.resultDisplayed) {
    // Pressing a digit after "=" starts a fresh calculation
    return {
      display: raw,
      expression: "",
      storedOperand: null,
      pendingOperator: null,
      resultDisplayed: false,
      isError: false,
    };
  }

  const current = state.display;

  // Guard: no double decimal
  if (digit === "." && current.includes(".")) {
    return state;
  }

  // Guard: display overflow
  const next = current === "0" && digit !== "."
    ? digit
    : current + digit;
  if (next.length > MAX_DISPLAY_CHARS) {
    return state;
  }

  return { ...state, display: next };
}

// Apply an operator press, returning the next state
export function applyOperator(state: CalcState, op: Operator): CalcState {
  if (state.isError) return state;

  const currentValue = parseFloat(state.display);

  // Commit a live preview if we already have a stored operand
  if (state.storedOperand !== null && state.pendingOperator !== null) {
    const result = compute(state.storedOperand, state.pendingOperator, currentValue);
    if (isErrorState(result)) {
      return {
        display: "Error",
        expression: "",
        storedOperand: null,
        pendingOperator: null,
        resultDisplayed: false,
        isError: true,
      };
    }
    const displayStr = formatResult(result);
    const expr = truncateExpression(
      `${formatResult(state.storedOperand)} ${state.pendingOperator} ${formatResult(currentValue)}`,
    );
    return {
      display: displayStr,
      expression: expr,
      storedOperand: result,
      pendingOperator: op,
      resultDisplayed: false,
      isError: false,
    };
  }

  // No operand yet — just store it
  return {
    display: formatResult(currentValue),
    expression: truncateExpression(`${formatResult(currentValue)} ${op}`),
    storedOperand: currentValue,
    pendingOperator: op,
    resultDisplayed: false,
    isError: false,
  };
}

// Commit the pending calculation on "="
export function applyEquals(state: CalcState): CalcState {
  if (state.isError) return state;
  if (state.storedOperand === null || state.pendingOperator === null) {
    // Nothing pending — no-op
    return state;
  }

  const currentValue = parseFloat(state.display);
  const result = compute(state.storedOperand, state.pendingOperator, currentValue);

  if (isErrorState(result)) {
    return {
      display: "Error",
      expression: "",
      storedOperand: null,
      pendingOperator: null,
      resultDisplayed: false,
      isError: true,
    };
  }

  const expr = truncateExpression(
    `${formatResult(state.storedOperand)} ${state.pendingOperator} ${formatResult(currentValue)} =`,
  );

  return {
    display: formatResult(result),
    expression: expr,
    storedOperand: result,
    pendingOperator: null,
    resultDisplayed: true,
    isError: false,
  };
}

// Clear all state
export function applyClear(): CalcState {
  return initialState();
}

function initialState(): CalcState {
  return {
    display: "0",
    expression: "",
    storedOperand: null,
    pendingOperator: null,
    resultDisplayed: false,
    isError: false,
  };
}

function truncateExpression(expr: string): string {
  if (expr.length > MAX_EXPRESSION_CHARS) {
    return "…" + expr.slice(expr.length - (MAX_EXPRESSION_CHARS - 1));
  }
  return expr;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OPERATORS: { key: string; display: string; ariaLabel: string }[] = [
  { key: "+", display: "+", ariaLabel: "Add" },
  { key: "−", display: "−", ariaLabel: "Subtract" },
  { key: "×", display: "×", ariaLabel: "Multiply" },
  { key: "÷", display: "÷", ariaLabel: "Divide" },
];

const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
const BOTTOM_ROW: { label: string; className: string; ariaLabel: string }[] = [
  { label: "+/−", className: styles.sign, ariaLabel: "Toggle sign" },
  { label: "0", className: styles.digitDouble, ariaLabel: "Zero" },
  { label: ".", className: styles.decimal, ariaLabel: "Decimal point" },
];

export function Calculator() {
  const [state, setState] = useState<CalcState>(initialState);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the container on mount so keyboard events are captured immediately
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

  // Keyboard handler — attached to the focusable container
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

      // Shift+= produces "+" in Shift mode, but we handle it via the shift key state
      if (key === "+" && e.shiftKey) {
        e.preventDefault();
        handleSignToggle();
        return;
      }
    },
    [handleDigit, handleOperator, handleEquals, handleBackspace, handleClear, handlePercent, handleSignToggle],
  );

  const displayValue = state.display;

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
            <div className={styles.resultLine}>{displayValue}</div>
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
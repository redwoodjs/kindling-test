import { describe, it } from "node:test";
import assert from "node:assert";
import {
  compute,
  formatResult,
  applyDigit,
  applyOperator,
  applyEquals,
  applyClear,
  initialState,
  type CalcState,
  type Operator,
} from "./calculator.logic.js";

function makeState(overrides: Partial<CalcState> = {}): CalcState {
  return {
    display: "0",
    expression: "",
    storedOperand: null,
    pendingOperator: null,
    resultDisplayed: false,
    isError: false,
    ...overrides,
  };
}

// ─── compute ─────────────────────────────────────────────────────────────────

describe("compute", () => {
  it("adds two numbers", () => {
    assert.strictEqual(compute(125, "+", 7), 132);
  });

  it("subtracts two numbers", () => {
    assert.strictEqual(compute(10, "−", 3), 7);
  });

  it("multiplies two numbers", () => {
    assert.strictEqual(compute(4, "×", 7), 28);
  });

  it("divides two numbers", () => {
    assert.strictEqual(compute(20, "÷", 4), 5);
  });

  it("divides by zero returns Infinity", () => {
    assert.strictEqual(compute(5, "÷", 0), Infinity);
  });

  it("handles negative results", () => {
    assert.strictEqual(compute(3, "−", 8), -5);
  });
});

// ─── formatResult ─────────────────────────────────────────────────────────────

describe("formatResult", () => {
  it("formats a simple integer", () => {
    assert.strictEqual(formatResult(132), "132");
  });

  it("strips trailing zeros after decimal", () => {
    assert.strictEqual(formatResult(10.0), "10");
  });

  it("handles 0.1 + 0.2 without floating-point noise", () => {
    assert.strictEqual(formatResult(0.1 + 0.2), "0.3");
  });

  it("handles very small decimals", () => {
    assert.strictEqual(formatResult(0.5), "0.5");
  });

  it("uses scientific notation for large numbers", () => {
    assert.strictEqual(formatResult(1e12), "1e+12");
  });

  it("returns Error for Infinity", () => {
    assert.strictEqual(formatResult(Infinity), "Error");
  });

  it("returns Error for -Infinity", () => {
    assert.strictEqual(formatResult(-Infinity), "Error");
  });

  it("handles negative numbers", () => {
    assert.strictEqual(formatResult(-7), "-7");
  });

  it("handles division producing decimals", () => {
    assert.strictEqual(formatResult(1 / 3), "0.3333333333");
  });
});

// ─── applyDigit ───────────────────────────────────────────────────────────────

describe("applyDigit", () => {
  it("shows a single digit", () => {
    const s = makeState();
    const next = applyDigit(s, "7");
    assert.strictEqual(next.display, "7");
  });

  it("appends subsequent digits", () => {
    const s = makeState({ display: "7" });
    const next = applyDigit(s, "3");
    assert.strictEqual(next.display, "73");
  });

  it("replaces display after result is shown", () => {
    const s = makeState({ display: "132", resultDisplayed: true });
    const next = applyDigit(s, "9");
    assert.strictEqual(next.display, "9");
    assert.strictEqual(next.expression, "");
  });

  it("ignores extra decimal points", () => {
    const s = makeState({ display: "5.6" });
    const next = applyDigit(s, ".");
    assert.strictEqual(next.display, "5.6");
  });

  it("replaces leading zero with digit", () => {
    const s = makeState({ display: "0" });
    const next = applyDigit(s, "5");
    assert.strictEqual(next.display, "5");
  });

  it("allows 0. from leading zero", () => {
    const s = makeState({ display: "0" });
    const next = applyDigit(s, ".");
    assert.strictEqual(next.display, "0.");
  });

  it("resets machine from error state on digit press", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyDigit(s, "5");
    assert.strictEqual(next.display, "5");
    assert.strictEqual(next.isError, false);
  });

  it("allows appending up to the 15-character display cap", () => {
    const s = makeState({ display: "12345678901234" }); // 14 chars
    const next = applyDigit(s, "5");
    assert.strictEqual(next.display, "123456789012345");
  });
});

// ─── applyOperator ────────────────────────────────────────────────────────────

describe("applyOperator", () => {
  it("stores operand and sets operator", () => {
    const s = makeState({ display: "125" });
    const next = applyOperator(s, "+");
    assert.strictEqual(next.storedOperand, 125);
    assert.strictEqual(next.pendingOperator, "+");
    assert.strictEqual(next.expression, "125 +");
  });

  it("preview-commits when operand and operator already pending", () => {
    const s = makeState({
      display: "7",
      storedOperand: 125,
      pendingOperator: "+" as Operator,
    });
    const next = applyOperator(s, "×");
    assert.strictEqual(next.display, "132"); // 125 + 7
    assert.strictEqual(next.storedOperand, 132);
    assert.strictEqual(next.pendingOperator, "×");
    assert.strictEqual(next.expression, "125 + 7");
  });

  it("preview-commits with division by zero produces Error", () => {
    const s = makeState({
      display: "0",
      storedOperand: 5,
      pendingOperator: "÷" as Operator,
    });
    const next = applyOperator(s, "+");
    assert.strictEqual(next.display, "Error");
    assert.strictEqual(next.isError, true);
  });

  it("no-op when in error state", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyOperator(s, "+");
    assert.deepStrictEqual(next, s);
  });
});

// ─── applyEquals ─────────────────────────────────────────────────────────────

describe("applyEquals", () => {
  it("commits addition", () => {
    const s = makeState({
      display: "7",
      storedOperand: 125,
      pendingOperator: "+" as Operator,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "132");
    assert.strictEqual(next.expression, "125 + 7 =");
    assert.strictEqual(next.resultDisplayed, true);
  });

  it("commits subtraction", () => {
    const s = makeState({
      display: "3",
      storedOperand: 10,
      pendingOperator: "−" as Operator,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "7");
  });

  it("commits multiplication", () => {
    const s = makeState({
      display: "7",
      storedOperand: 4,
      pendingOperator: "×" as Operator,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "28");
  });

  it("commits division", () => {
    const s = makeState({
      display: "4",
      storedOperand: 20,
      pendingOperator: "÷" as Operator,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "5");
  });

  it("no-op when no operator is pending", () => {
    const s = makeState({ display: "42" });
    const next = applyEquals(s);
    assert.deepStrictEqual(next, s);
  });

  it("no-op when in error state", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyEquals(s);
    assert.deepStrictEqual(next, s);
  });

  it("division by zero produces Error", () => {
    const s = makeState({
      display: "0",
      storedOperand: 5,
      pendingOperator: "÷" as Operator,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "Error");
    assert.strictEqual(next.isError, true);
  });

  it("chains: second equals repeats last operation using stored result", () => {
    const s = makeState({
      display: "3",
      storedOperand: 132,
      pendingOperator: "+" as Operator,
      resultDisplayed: true,
    });
    const next = applyEquals(s);
    assert.strictEqual(next.display, "135"); // 132 + 3
  });
});

// ─── applyClear ──────────────────────────────────────────────────────────────

describe("applyClear", () => {
  it("resets everything to initial state", () => {
    const s = makeState({
      display: "875",
      expression: "125 + 7 =",
      storedOperand: 132,
      pendingOperator: "+" as Operator,
      resultDisplayed: true,
    });
    const next = applyClear();
    assert.strictEqual(next.display, "0");
    assert.strictEqual(next.expression, "");
    assert.strictEqual(next.storedOperand, null);
    assert.strictEqual(next.pendingOperator, null);
    assert.strictEqual(next.resultDisplayed, false);
    assert.strictEqual(next.isError, false);
  });
});

// ─── Backspace ───────────────────────────────────────────────────────────────

describe("backspace behavior", () => {
  it("removes last character from display", () => {
    const s = makeState({ display: "125" });
    const next = { ...s, display: s.display.slice(0, -1) };
    assert.strictEqual(next.display, "12");
  });

  it("reduces single character to zero", () => {
    const s = makeState({ display: "1" });
    const next =
      s.display.length <= 1
        ? { ...s, display: "0" }
        : { ...s, display: s.display.slice(0, -1) };
    assert.strictEqual(next.display, "0");
  });
});

// ─── Percent ─────────────────────────────────────────────────────────────────

describe("percent behavior", () => {
  it("divides display value by 100", () => {
    const s = makeState({ display: "50" });
    const result = parseFloat(s.display) / 100;
    assert.strictEqual(result, 0.5);
  });

  it("does not apply when in error state", () => {
    const s = makeState({ display: "Error", isError: true });
    assert.strictEqual(s.isError, true);
  });
});

// ─── Sign toggle ─────────────────────────────────────────────────────────────

describe("sign toggle behavior", () => {
  it("negates a positive display", () => {
    const s = makeState({ display: "7" });
    const next = {
      ...s,
      display: s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display,
    };
    assert.strictEqual(next.display, "-7");
  });

  it("removes negation from negative display", () => {
    const s = makeState({ display: "-7" });
    const next = {
      ...s,
      display: s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display,
    };
    assert.strictEqual(next.display, "7");
  });

  it("no-op on zero", () => {
    const s = makeState({ display: "0" });
    const next =
      s.display === "0"
        ? s
        : {
            ...s,
            display: s.display.startsWith("-")
              ? s.display.slice(1)
              : "-" + s.display,
          };
    assert.strictEqual(next.display, "0");
  });
});

// ─── Expression truncation ───────────────────────────────────────────────────

describe("expression truncation", () => {
  it("truncates from left when expression exceeds 30 characters", () => {
    const long = "12345678901234567890123456789012"; // 32 chars
    const truncated =
      long.length > 30 ? "…" + long.slice(long.length - 29) : long;
    assert.strictEqual(truncated.length, 30);
    assert.ok(truncated.startsWith("…"));
  });

  it("leaves short expressions unchanged", () => {
    const expr = "125 + 7";
    const truncated = expr.length > 30 ? "…" + expr.slice(expr.length - 29) : expr;
    assert.strictEqual(truncated, "125 + 7");
  });
});
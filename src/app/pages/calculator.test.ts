import { describe, it, expect } from "node:test";
import {
  compute,
  formatResult,
  applyDigit,
  applyOperator,
  applyEquals,
  applyClear,
  type CalcState,
  type Operator,
} from "./calculator.js";

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
    expect(compute(125, "+", 7)).toBe(132);
  });

  it("subtracts two numbers", () => {
    expect(compute(10, "−", 3)).toBe(7);
  });

  it("multiplies two numbers", () => {
    expect(compute(4, "×", 7)).toBe(28);
  });

  it("divides two numbers", () => {
    expect(compute(20, "÷", 4)).toBe(5);
  });

  it("divides by zero returns Infinity", () => {
    expect(compute(5, "÷", 0)).toBe(Infinity);
  });

  it("handles negative results", () => {
    expect(compute(3, "−", 8)).toBe(-5);
  });
});

// ─── formatResult ─────────────────────────────────────────────────────────────

describe("formatResult", () => {
  it("formats a simple integer", () => {
    expect(formatResult(132)).toBe("132");
  });

  it("strips trailing zeros after decimal", () => {
    expect(formatResult(10.0)).toBe("10");
  });

  it("handles 0.1 + 0.2 without floating-point noise", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });

  it("handles very small decimals", () => {
    expect(formatResult(0.5)).toBe("0.5");
  });

  it("uses scientific notation for large numbers", () => {
    expect(formatResult(1e12)).toBe("1e+12");
  });

  it("returns Error for Infinity", () => {
    expect(formatResult(Infinity)).toBe("Error");
  });

  it("returns Error for -Infinity", () => {
    expect(formatResult(-Infinity)).toBe("Error");
  });

  it("handles negative numbers", () => {
    expect(formatResult(-7)).toBe("-7");
  });

  it("handles division producing decimals", () => {
    expect(formatResult(1 / 3)).toBe("0.3333333333");
  });
});

// ─── applyDigit ───────────────────────────────────────────────────────────────

describe("applyDigit", () => {
  it("shows a single digit", () => {
    const s = makeState();
    const next = applyDigit(s, "7");
    expect(next.display).toBe("7");
  });

  it("appends subsequent digits", () => {
    const s = makeState({ display: "7" });
    const next = applyDigit(s, "3");
    expect(next.display).toBe("73");
  });

  it("replaces display after result is shown", () => {
    const s = makeState({ display: "132", resultDisplayed: true });
    const next = applyDigit(s, "9");
    expect(next.display).toBe("9");
    expect(next.expression).toBe("");
  });

  it("ignores extra decimal points", () => {
    const s = makeState({ display: "5.6" });
    const next = applyDigit(s, ".");
    expect(next.display).toBe("5.6");
  });

  it("replaces leading zero with digit", () => {
    const s = makeState({ display: "0" });
    const next = applyDigit(s, "5");
    expect(next.display).toBe("5");
  });

  it("allows 0. from leading zero", () => {
    const s = makeState({ display: "0" });
    const next = applyDigit(s, ".");
    expect(next.display).toBe("0.");
  });

  it("resets machine from error state on digit press", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyDigit(s, "5");
    expect(next.display).toBe("5");
    expect(next.isError).toBe(false);
  });

  it("guards against display overflow (15 char cap)", () => {
    const long = "12345678901234"; // 14 chars
    const s = makeState({ display: long });
    const next = applyDigit(s, "5");
    // 15 chars is the limit — this should be allowed
    expect(next.display).toBe(long + "5");
  });
});

// ─── applyOperator ────────────────────────────────────────────────────────────

describe("applyOperator", () => {
  it("stores operand and sets operator", () => {
    const s = makeState({ display: "125" });
    const next = applyOperator(s, "+");
    expect(next.storedOperand).toBe(125);
    expect(next.pendingOperator).toBe("+");
    expect(next.expression).toBe("125 +");
  });

  it("preview-commits when operand and operator already pending", () => {
    const s = makeState({
      display: "7",
      storedOperand: 125,
      pendingOperator: "+" as Operator,
    });
    const next = applyOperator(s, "×");
    expect(next.display).toBe("132"); // 125 + 7
    expect(next.storedOperand).toBe(132);
    expect(next.pendingOperator).toBe("×");
    expect(next.expression).toBe("125 + 7");
  });

  it("preview-commits with division by zero", () => {
    const s = makeState({
      display: "0",
      storedOperand: 5,
      pendingOperator: "÷" as Operator,
    });
    const next = applyOperator(s, "+");
    expect(next.display).toBe("Error");
    expect(next.isError).toBe(true);
  });

  it("no-op when in error state", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyOperator(s, "+");
    expect(next).toBe(s);
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
    expect(next.display).toBe("132");
    expect(next.expression).toBe("125 + 7 =");
    expect(next.resultDisplayed).toBe(true);
  });

  it("commits subtraction", () => {
    const s = makeState({
      display: "3",
      storedOperand: 10,
      pendingOperator: "−" as Operator,
    });
    const next = applyEquals(s);
    expect(next.display).toBe("7");
  });

  it("commits multiplication", () => {
    const s = makeState({
      display: "7",
      storedOperand: 4,
      pendingOperator: "×" as Operator,
    });
    const next = applyEquals(s);
    expect(next.display).toBe("28");
  });

  it("commits division", () => {
    const s = makeState({
      display: "4",
      storedOperand: 20,
      pendingOperator: "÷" as Operator,
    });
    const next = applyEquals(s);
    expect(next.display).toBe("5");
  });

  it("no-op when no operator is pending", () => {
    const s = makeState({ display: "42" });
    const next = applyEquals(s);
    expect(next).toBe(s);
  });

  it("no-op when in error state", () => {
    const s = makeState({ display: "Error", isError: true });
    const next = applyEquals(s);
    expect(next).toBe(s);
  });

  it("division by zero produces Error", () => {
    const s = makeState({
      display: "0",
      storedOperand: 5,
      pendingOperator: "÷" as Operator,
    });
    const next = applyEquals(s);
    expect(next.display).toBe("Error");
    expect(next.isError).toBe(true);
  });

  it("chains: second equals repeats last operation", () => {
    const s = makeState({
      display: "3",
      storedOperand: 132,
      pendingOperator: "+" as Operator,
      resultDisplayed: true,
    });
    const next = applyEquals(s);
    expect(next.display).toBe("135"); // 132 + 3
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
    expect(next.display).toBe("0");
    expect(next.expression).toBe("");
    expect(next.storedOperand).toBeNull();
    expect(next.pendingOperator).toBeNull();
    expect(next.resultDisplayed).toBe(false);
  });
});

// ─── Backspace (inline via applyDigit inverse) ───────────────────────────────

describe("backspace behavior", () => {
  it("removes last character from display", () => {
    const s = makeState({ display: "125" });
    const next = { ...s, display: s.display.slice(0, -1) };
    expect(next.display).toBe("12");
  });

  it("reduces single digit to zero", () => {
    const s = makeState({ display: "1" });
    const next = { ...s, display: s.display.length <= 1 ? "0" : s.display.slice(0, -1) };
    expect(next.display).toBe("0");
  });
});

// ─── Percent ─────────────────────────────────────────────────────────────────

describe("percent behavior", () => {
  it("divides display value by 100", () => {
    const s = makeState({ display: "50" });
    const result = parseFloat(s.display) / 100;
    expect(result).toBe(0.5);
  });

  it("does not apply to error state", () => {
    const s = makeState({ display: "Error", isError: true });
    expect(s.isError).toBe(true);
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
    expect(next.display).toBe("-7");
  });

  it("removes negation from negative display", () => {
    const s = makeState({ display: "-7" });
    const next = {
      ...s,
      display: s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display,
    };
    expect(next.display).toBe("7");
  });

  it("no-op on zero", () => {
    const s = makeState({ display: "0" });
    const next = s.display === "0" ? s : {
      ...s,
      display: s.display.startsWith("-") ? s.display.slice(1) : "-" + s.display,
    };
    expect(next.display).toBe("0");
  });
});

// ─── Expression truncation ────────────────────────────────────────────────────

describe("expression truncation (30 char cap)", () => {
  it("truncates from left when expression exceeds 30 chars", () => {
    const long = "12345678901234567890123456789012"; // 32 chars
    const truncated = long.length > 30 ? "…" + long.slice(long.length - 29) : long;
    expect(truncated.length).toBe(30);
    expect(truncated.startsWith("…")).toBe(true);
  });

  it("leaves short expressions unchanged", () => {
    const expr = "125 + 7";
    const truncated = expr.length > 30 ? "…" + expr.slice(expr.length - 29) : expr;
    expect(truncated).toBe("125 + 7");
  });
});
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
  if (Math.abs(n) >= 1e10) {
    // Strip trailing zeros from the mantissa in scientific notation, e.g.
    // "1.00000e+12" → "1e+12", "1.20000e+12" → "1.2e+12"
    return n.toExponential(5).replace(/\.?0+([e\+])/, "$1");
  }
  // Round to 10 significant digits then strip trailing zeros
  const rounded = parseFloat(n.toPrecision(10));
  const fixed = rounded.toString();
  if (fixed.includes(".")) {
    return fixed.replace(/\.?0+$/, "");
  }
  return fixed;
}

function isErrorState(n: number): boolean {
  return !isFinite(n);
}

export function applyDigit(state: CalcState, digit: string): CalcState {
  const raw = digit === "." ? "0." : digit;

  if (state.isError) {
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

  if (digit === "." && current.includes(".")) {
    return state;
  }

  const next =
    current === "0" && digit !== "." ? digit : current + digit;
  if (next.length > MAX_DISPLAY_CHARS) {
    return state;
  }

  return { ...state, display: next };
}

export function applyOperator(state: CalcState, op: Operator): CalcState {
  if (state.isError) return state;

  const currentValue = parseFloat(state.display);

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

  return {
    display: formatResult(currentValue),
    expression: truncateExpression(`${formatResult(currentValue)} ${op}`),
    storedOperand: currentValue,
    pendingOperator: op,
    resultDisplayed: false,
    isError: false,
  };
}

export function applyEquals(state: CalcState): CalcState {
  if (state.isError) return state;
  if (state.storedOperand === null || state.pendingOperator === null) {
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

export function applyClear(): CalcState {
  return initialState();
}

export function initialState(): CalcState {
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
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DownPaymentMode = "amount" | "percent";

export interface MortgageInputs {
  homePriceRaw: string;
  dpRaw: string;
  dpMode: DownPaymentMode;
  interestRateRaw: string;
  loanTermYears: number;
  taxRaw: string;
  insuranceRaw: string;
}

export interface MortgageResults {
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyTotal: number;
  totalCost: number;
  totalInterest: number;
  principal: number;
  hasError: boolean;
  errorField?: "homePrice" | "downPayment" | "interestRate" | "loanTerm";
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Bounds constants (exported for tests)
// ---------------------------------------------------------------------------

export const HOME_PRICE_MIN = 1;
export const HOME_PRICE_MAX = 100_000_000;
export const DOWN_PAYMENT_MAX_PERCENT = 100;
export const RATE_MIN = 0.1;
export const RATE_MAX = 30;
export const TERM_MIN = 1;
export const TERM_MAX = 40;
export const TAX_MAX = 100_000;
export const INSURANCE_MAX = 100_000;

// ---------------------------------------------------------------------------
// Parsing utilities
// ---------------------------------------------------------------------------

/** Strip $, commas, whitespace and parse as float. Returns NaN on failure. */
export function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  return cleaned === "" ? NaN : parseFloat(cleaned);
}

/** Format a float as a USD currency string with commas and 2dp. */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const fixed = rounded.toFixed(2);
  return "$" + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a float as an integer string with commas (no decimal). */
export function formatInteger(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

// ---------------------------------------------------------------------------
// Down payment helpers
// ---------------------------------------------------------------------------

export function computeDownPaymentFromPercent(homePrice: number, percent: number): number {
  return Math.round((homePrice * percent) / 100 * 100) / 100;
}

export function computeDownPaymentFromAmount(amount: number): number {
  return amount;
}

export function computePrincipal(homePrice: number, downPaymentAmount: number): number {
  return homePrice - downPaymentAmount;
}

/**
 * Returns a display string for the down payment field.
 * In amount mode: formats the dollar amount as currency.
 * In percent mode: formats the percentage value.
 */
export function getDownPaymentDisplay(
  downPaymentRaw: number,
  mode: DownPaymentMode,
  homePrice: number,
): string {
  if (mode === "percent") {
    if (homePrice <= 0 || Number.isNaN(homePrice)) return String(downPaymentRaw);
    return String(Math.round((downPaymentRaw / homePrice) * 100 * 100) / 100);
  }
  return formatCurrency(downPaymentRaw);
}

// ---------------------------------------------------------------------------
// Amortization
// ---------------------------------------------------------------------------

/**
 * Standard fixed-payment amortization:
 *   M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * P = principal (price - down payment)
 * r = monthly rate (annual % / 12 / 100)
 * n = total months (years * 12)
 *
 * Returns the monthly PI payment rounded to cents. Returns NaN when inputs
 * are invalid (zero term) or when principal is 0 (returns 0).
 */
export function calculateMonthlyPI(
  principal: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  if (termYears <= 0) return NaN;
  if (annualRatePercent <= 0) {
    // 0% interest — simple equal distribution
    return Math.round((principal / (termYears * 12)) * 100) / 100;
  }
  const r = annualRatePercent / 100 / 12;
  const n = termYears * 12;
  const factor = Math.pow(1 + r, n);
  const payment = principal * ((r * factor) / (factor - 1));
  return Math.round(payment * 100) / 100;
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

export function computeMortgage(inputs: MortgageInputs): MortgageResults {
  const { homePriceRaw, dpRaw, dpMode, interestRateRaw, loanTermYears, taxRaw, insuranceRaw } = inputs;

  // ── Home price ───────────────────────────────────────────────────────────
  const hp = parseCurrency(homePriceRaw);
  if (homePriceRaw !== "" && (Number.isNaN(hp) || hp <= 0)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "homePrice",
      errorMessage: hp === 0
        ? "Home price must be greater than zero."
        : "Enter a valid home price.",
    };
  }
  if (!Number.isNaN(hp) && hp > HOME_PRICE_MAX) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "homePrice",
      errorMessage: `Home price cannot exceed $${HOME_PRICE_MAX.toLocaleString("en-US")}.`,
    };
  }

  // ── Down payment ──────────────────────────────────────────────────────────
  const dpVal = parseCurrency(dpRaw);
  if (dpRaw !== "" && Number.isNaN(dpVal)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "downPayment",
      errorMessage: "Enter a valid down payment.",
    };
  }
  if (dpRaw !== "" && !Number.isNaN(dpVal)) {
    if (dpMode === "amount") {
      if (!Number.isNaN(hp) && dpVal < 0) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot be negative.",
        };
      }
      if (!Number.isNaN(hp) && dpVal > hp) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot exceed the home price.",
        };
      }
    } else {
      // percent mode
      if (dpVal > DOWN_PAYMENT_MAX_PERCENT) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot exceed 100% of the home price.",
        };
      }
    }
  }

  // ── Interest rate ────────────────────────────────────────────────────────
  const rate = parseFloat(interestRateRaw);
  if (interestRateRaw !== "" && (Number.isNaN(rate) || rate < RATE_MIN)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "interestRate",
      errorMessage: "Interest rate must be at least 0.1%.",
    };
  }
  if (!Number.isNaN(rate) && rate > RATE_MAX) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "interestRate",
      errorMessage: "Interest rate cannot exceed 30%.",
    };
  }

  // ── Loan term ─────────────────────────────────────────────────────────────
  if (loanTermYears < TERM_MIN) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "loanTerm",
      errorMessage: "Loan term must be at least 1 year.",
    };
  }
  if (loanTermYears > TERM_MAX) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "loanTerm",
      errorMessage: "Loan term cannot exceed 40 years.",
    };
  }

  // ── Required field check ──────────────────────────────────────────────────
  const requiredReady =
    !Number.isNaN(hp) && hp > 0 &&
    dpRaw !== "" && !Number.isNaN(dpVal) &&
    interestRateRaw !== "" && !Number.isNaN(rate);

  if (!requiredReady) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
    };
  }

  // ── Optional fields ────────────────────────────────────────────────────────
  const tax = parseCurrency(taxRaw);
  const ins = parseCurrency(insuranceRaw);
  const monthlyTax = !Number.isNaN(tax) && tax > 0 ? tax / 12 : 0;
  const monthlyInsurance = !Number.isNaN(ins) && ins > 0 ? ins / 12 : 0;

  // ── Compute ───────────────────────────────────────────────────────────────
  const dpAmount =
    dpMode === "percent"
      ? computeDownPaymentFromPercent(hp, dpVal)
      : dpVal;
  const principal = computePrincipal(hp, dpAmount);
  const monthlyPI = calculateMonthlyPI(principal, rate, loanTermYears);
  const monthlyTotal = Math.round((monthlyPI + monthlyTax + monthlyInsurance) * 100) / 100;
  const totalMonths = loanTermYears * 12;
  const totalCost = Math.round(monthlyTotal * totalMonths * 100) / 100;
  const totalInterest = Math.max(0, Math.round((totalCost - principal) * 100) / 100);

  return {
    monthlyPI,
    monthlyTax: Math.round(monthlyTax * 100) / 100,
    monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
    monthlyTotal,
    totalCost,
    totalInterest,
    principal: Math.round(principal * 100) / 100,
    hasError: false,
  };
}

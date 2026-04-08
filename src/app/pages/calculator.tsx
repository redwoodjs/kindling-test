"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./calculator.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DownPaymentMode = "amount" | "percent";

interface MortgageResults {
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
// Parsing
// ---------------------------------------------------------------------------

/** Strip $, commas, whitespace and parse as float. Returns NaN on failure. */
function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, "");
  return cleaned === "" ? NaN : parseFloat(cleaned);
}

/** Format a float as a USD currency string with commas and 2dp. */
function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const fixed = rounded.toFixed(2);
  return "$" + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a float as an integer string with commas (no decimal). */
function formatInteger(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
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
function calculateMonthlyPI(
  principal: number,
  annualRatePercent: number,
  termYears: number
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
// Core calculation
// ---------------------------------------------------------------------------

function computeMortgage(inputs: {
  homePrice: string;
  downPayment: string;
  downPaymentMode: DownPaymentMode;
  interestRate: string;
  loanTermYears: number;
  propertyTax: string;
  insurance: string;
}): MortgageResults {
  const { homePrice, downPayment, downPaymentMode, interestRate, loanTermYears, propertyTax, insurance } = inputs;

  // ── Home price ───────────────────────────────────────────────────────────
  const hp = parseCurrency(homePrice);
  if (homePrice !== "" && (Number.isNaN(hp) || hp <= 0)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "homePrice",
      errorMessage: hp === 0
        ? "Home price must be greater than zero."
        : "Enter a valid home price.",
    };
  }
  if (!Number.isNaN(hp) && hp > 100_000_000) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "homePrice",
      errorMessage: "Home price cannot exceed $100,000,000.",
    };
  }

  // ── Down payment ──────────────────────────────────────────────────────────
  const dpRaw = parseCurrency(downPayment);
  if (downPayment !== "" && Number.isNaN(dpRaw)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "downPayment",
      errorMessage: "Enter a valid down payment.",
    };
  }
  if (downPayment !== "" && !Number.isNaN(dpRaw)) {
    if (downPaymentMode === "amount") {
      if (!Number.isNaN(hp) && dpRaw < 0) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot be negative.",
        };
      }
      if (!Number.isNaN(hp) && dpRaw > hp) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot exceed the home price.",
        };
      }
    } else {
      // percent mode
      if (dpRaw > 100) {
        return {
          monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
          totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
          errorField: "downPayment",
          errorMessage: "Down payment cannot exceed 100% of the home price.",
        };
      }
    }
  }

  // Resolve effective down payment in dollars
  let dpAmount = 0;
  if (downPayment !== "" && !Number.isNaN(dpRaw) && !Number.isNaN(hp)) {
    dpAmount =
      downPaymentMode === "percent"
        ? hp * (dpRaw / 100)
        : dpRaw;
  }

  // ── Interest rate ────────────────────────────────────────────────────────
  const rate = parseFloat(interestRate);
  if (interestRate !== "" && (Number.isNaN(rate) || rate < 0.1)) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "interestRate",
      errorMessage: "Interest rate must be at least 0.1%.",
    };
  }
  if (!Number.isNaN(rate) && rate > 30) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "interestRate",
      errorMessage: "Interest rate cannot exceed 30%.",
    };
  }

  // ── Loan term ─────────────────────────────────────────────────────────────
  if (loanTermYears < 1) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
      errorField: "loanTerm",
      errorMessage: "Loan term must be at least 1 year.",
    };
  }
  if (loanTermYears > 40) {
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
    downPayment !== "" && !Number.isNaN(dpRaw) &&
    interestRate !== "" && !Number.isNaN(rate);

  if (!requiredReady) {
    return {
      monthlyPI: 0, monthlyTax: 0, monthlyInsurance: 0, monthlyTotal: 0,
      totalCost: 0, totalInterest: 0, principal: 0, hasError: true,
    };
  }

  // ── Optional fields ────────────────────────────────────────────────────────
  const tax = parseCurrency(propertyTax);
  const ins = parseCurrency(insurance);
  const monthlyTax = !Number.isNaN(tax) && tax > 0 ? tax / 12 : 0;
  const monthlyInsurance = !Number.isNaN(ins) && ins > 0 ? ins / 12 : 0;

  // ── Compute ───────────────────────────────────────────────────────────────
  const principal = hp - dpAmount;
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

// ---------------------------------------------------------------------------
// Loan term presets
// ---------------------------------------------------------------------------

const LOAN_PRESETS = [15, 20, 30] as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const Calculator = () => {
  const [homePrice, setHomePrice] = useState("");
  const [downPayment, setDownPayment] = useState("20");
  const [downPaymentMode, setDownPaymentMode] = useState<DownPaymentMode>("percent");
  const [interestRate, setInterestRate] = useState("");
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTax, setPropertyTax] = useState("");
  const [insurance, setInsurance] = useState("");

  // Focused field tracking (for currency formatting)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animation state
  const [animating, setAnimating] = useState(false);
  const prevTotalRef = useRef(0);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive results on every render
  const results = computeMortgage({
    homePrice,
    downPayment,
    downPaymentMode,
    interestRate,
    loanTermYears,
    propertyTax,
    insurance,
  });

  // Trigger CSS animation when monthlyTotal changes to a non-zero value
  useEffect(() => {
    if (!results.hasError && results.monthlyTotal > 0 && results.monthlyTotal !== prevTotalRef.current) {
      if (prevTotalRef.current !== 0) {
        // Cancel any ongoing animation and restart
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        setAnimating(false);
        requestAnimationFrame(() => {
          setAnimating(true);
          animationTimerRef.current = setTimeout(() => setAnimating(false), 350);
        });
      }
      prevTotalRef.current = results.monthlyTotal;
    }
    // If results cleared (all fields empty), reset the ref so a new first result animates
    if (results.hasError && prevTotalRef.current !== 0) {
      prevTotalRef.current = 0;
    }
  }, [results.monthlyTotal, results.hasError]);

  // Derived values for hints
  const hp = parseCurrency(homePrice);
  const effectiveDownPayment =
    downPaymentMode === "percent"
      ? Math.round((!Number.isNaN(hp) ? hp : 0) * (parseFloat(downPayment) || 0) / 100)
      : parseCurrency(downPayment) || 0;
  const isCustomTerm =
    !LOAN_PRESETS.includes(loanTermYears as (typeof LOAN_PRESETS)[number]);

  // ── Input display helpers ──────────────────────────────────────────────────

  function displayValue(raw: string): string {
    if (focusedField) return raw;
    if (!raw) return "";
    const n = parseCurrency(raw);
    if (Number.isNaN(n)) return raw;
    return formatCurrency(n);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFocus(field: string) {
    setFocusedField(field);
  }

  function handleBlur(field: string) {
    setFocusedField(null);
    // On blur, format the field value if it looks like a number
    // State is already raw; displayValue will format on next render
    void field;
  }

  function handleHomePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHomePrice(e.target.value);
  }

  function handleDownPaymentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDownPayment(e.target.value);
  }

  function toggleDownPaymentMode() {
    if (downPaymentMode === "percent") {
      // → amount mode: show effective dollar amount
      const amount = Math.round(effectiveDownPayment);
      setDownPayment(amount > 0 ? String(amount) : "0");
      setDownPaymentMode("amount");
    } else {
      // → percent mode: show percentage of home price
      if (!Number.isNaN(hp) && hp > 0) {
        const pct = Math.round((effectiveDownPayment / hp) * 100);
        setDownPayment(pct > 0 ? String(pct) : "0");
      } else {
        setDownPayment("0");
      }
      setDownPaymentMode("percent");
    }
  }

  function handleInterestRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInterestRate(e.target.value);
  }

  function handleLoanTermPreset(years: (typeof LOAN_PRESETS)[number]) {
    setLoanTermYears(years);
  }

  function handleLoanTermCustom(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setLoanTermYears(parsed);
    } else if (raw.trim() === "") {
      setLoanTermYears(0);
    }
  }

  function handlePropertyTaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPropertyTax(e.target.value);
  }

  function handleInsuranceChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInsurance(e.target.value);
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function resultCell(label: string, value: number, prefix = "$"): string {
    if (results.hasError || (value === 0 && homePrice === "")) return "--";
    if (prefix === "$") return formatCurrency(value);
    return value.toLocaleString("en-US");
  }

  const showExclusionNote =
    !results.hasError && propertyTax === "" && insurance === "";

  const showZeroNote =
    !results.hasError && results.monthlyPI === 0 && hp > 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mortgage Calculator</h1>
        <p className={styles.subtitle}>
          Explore your monthly payment and total loan cost.
        </p>
      </header>

      <main className={styles.main}>
        {/* Financial disclaimer */}
        <div className={styles.disclaimer}>
          <span className={styles.disclaimerIcon} aria-hidden="true">⚠</span>
          <p className={styles.disclaimerText}>
            These results are estimates only and do not constitute financial advice.
            Consult a qualified financial professional before making any decisions.
          </p>
        </div>

        <div className={styles.grid}>
          {/* ── INPUTS ──────────────────────────────────────────────────── */}
          <section className={styles.inputs} aria-label="Mortgage inputs">

            {/* Home price */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="home-price">
                Home Price <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix} aria-hidden="true">$</span>
                <input
                  id="home-price"
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${styles.inputWithPrefix} ${results.errorField === "homePrice" ? styles.inputError : ""}`}
                  value={displayValue(homePrice)}
                  placeholder="e.g. 450,000"
                  onChange={handleHomePriceChange}
                  onFocus={() => handleFocus("homePrice")}
                  onBlur={() => handleBlur("homePrice")}
                  autoComplete="off"
                />
              </div>
              {results.errorField === "homePrice" && (
                <p className={styles.errorMessage} role="alert">{results.errorMessage}</p>
              )}
            </div>

            {/* Down payment */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="down-payment">
                Down Payment <span className={styles.required}>*</span>
              </label>
              <div className={styles.dpRow}>
                <div className={`${styles.inputWrapper} ${downPaymentMode === "percent" ? styles.inputWithSuffix : styles.inputWithPrefix}`}>
                  {downPaymentMode === "percent" ? (
                    <>
                      <input
                        id="down-payment"
                        type="text"
                        inputMode="numeric"
                        className={`${styles.input} ${styles.inputWithSuffix} ${results.errorField === "downPayment" ? styles.inputError : ""}`}
                        value={displayValue(downPayment)}
                        placeholder="e.g. 20"
                        onChange={handleDownPaymentChange}
                        onFocus={() => handleFocus("downPayment")}
                        onBlur={() => handleBlur("downPayment")}
                        autoComplete="off"
                      />
                      <span className={styles.inputSuffix} aria-hidden="true">%</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.inputPrefix} aria-hidden="true">$</span>
                      <input
                        id="down-payment"
                        type="text"
                        inputMode="numeric"
                        className={`${styles.input} ${styles.inputWithPrefix} ${results.errorField === "downPayment" ? styles.inputError : ""}`}
                        value={displayValue(downPayment)}
                        placeholder="e.g. 100,000"
                        onChange={handleDownPaymentChange}
                        onFocus={() => handleFocus("downPayment")}
                        onBlur={() => handleBlur("downPayment")}
                        autoComplete="off"
                      />
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={toggleDownPaymentMode}
                >
                  {downPaymentMode === "percent" ? "Amount" : "Percent"}
                </button>
              </div>
              {results.errorField === "downPayment" && (
                <p className={styles.errorMessage} role="alert">{results.errorMessage}</p>
              )}
              {/* Inline hint: effective dollar amount */}
              {homePrice !== "" && !Number.isNaN(hp) && hp > 0 && downPayment !== "" && (
                <p className={styles.hint}>
                  {downPaymentMode === "percent"
                    ? `$${effectiveDownPayment.toLocaleString("en-US", { maximumFractionDigits: 0 })} down`
                    : `${Math.round((effectiveDownPayment / hp) * 100)}% of home price`}
                </p>
              )}
            </div>

            {/* Interest rate */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="interest-rate">
                Annual Interest Rate <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="interest-rate"
                  type="text"
                  inputMode="decimal"
                  className={`${styles.input} ${styles.inputWithSuffix} ${results.errorField === "interestRate" ? styles.inputError : ""}`}
                  value={interestRate}
                  placeholder="e.g. 7"
                  onChange={handleInterestRateChange}
                  onFocus={() => handleFocus("interestRate")}
                  onBlur={() => handleBlur("interestRate")}
                  autoComplete="off"
                />
                <span className={styles.inputSuffix} aria-hidden="true">%</span>
              </div>
              {results.errorField === "interestRate" && (
                <p className={styles.errorMessage} role="alert">{results.errorMessage}</p>
              )}
            </div>

            {/* Loan term */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Loan Term <span className={styles.required}>*</span>
              </label>
              <div className={styles.presets}>
                {LOAN_PRESETS.map((yrs) => (
                  <button
                    key={yrs}
                    type="button"
                    className={`${styles.presetButton} ${loanTermYears === yrs && !isCustomTerm ? styles.presetActive : ""}`}
                    onClick={() => handleLoanTermPreset(yrs)}
                  >
                    {yrs} years
                  </button>
                ))}
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${styles.customTermInput} ${results.errorField === "loanTerm" ? styles.inputError : ""}`}
                  value={isCustomTerm ? loanTermYears : ""}
                  placeholder="Custom"
                  onChange={handleLoanTermCustom}
                  onFocus={() => setLoanTermYears(0)}
                  autoComplete="off"
                />
              </div>
              {results.errorField === "loanTerm" && (
                <p className={styles.errorMessage} role="alert">{results.errorMessage}</p>
              )}
            </div>

            {/* Property tax (optional) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="property-tax">
                Property Tax{" "}
                <span className={styles.optional}>(annual, optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix} aria-hidden="true">$</span>
                <input
                  id="property-tax"
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${styles.inputWithPrefix}`}
                  value={displayValue(propertyTax)}
                  placeholder="e.g. 6,000"
                  onChange={handlePropertyTaxChange}
                  onFocus={() => handleFocus("propertyTax")}
                  onBlur={() => handleBlur("propertyTax")}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Home insurance (optional) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="insurance">
                Home Insurance{" "}
                <span className={styles.optional}>(annual, optional)</span>
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix} aria-hidden="true">$</span>
                <input
                  id="insurance"
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${styles.inputWithPrefix}`}
                  value={displayValue(insurance)}
                  placeholder="e.g. 1,800"
                  onChange={handleInsuranceChange}
                  onFocus={() => handleFocus("insurance")}
                  onBlur={() => handleBlur("insurance")}
                  autoComplete="off"
                />
              </div>
            </div>
          </section>

          {/* ── RESULTS ─────────────────────────────────────────────────── */}
          <section className={styles.results} aria-label="Mortgage results">
            <h2 className={styles.resultsTitle}>Estimated Monthly Payment</h2>

            <div className={styles.primaryResult}>
              <span
                className={`${styles.primaryResultValue} ${animating ? styles.animating : ""}`}
              >
                {results.hasError ? "--" : resultCell("", results.monthlyTotal)}
              </span>
              <span className={styles.primaryResultLabel}>per month</span>
            </div>

            {showZeroNote && (
              <p className={styles.zeroNote}>
                No principal &amp; interest — down payment covers the full price.
              </p>
            )}

            {showExclusionNote && (
              <p className={styles.exclusionNote}>
                Estimate excludes property tax and insurance.
              </p>
            )}

            <div className={styles.breakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Principal &amp; Interest</span>
                <span className={styles.breakdownValue}>{resultCell("", results.monthlyPI)}</span>
              </div>
              {results.monthlyTax > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>
                    Est. Property Tax
                    <span className={styles.breakdownSub}>({formatCurrency(results.monthlyTax)}/mo)</span>
                  </span>
                  <span className={styles.breakdownValue}>{formatCurrency(results.monthlyTax)}</span>
                </div>
              )}
              {results.monthlyInsurance > 0 && (
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>
                    Est. Insurance
                    <span className={styles.breakdownSub}>({formatCurrency(results.monthlyInsurance)}/mo)</span>
                  </span>
                  <span className={styles.breakdownValue}>{formatCurrency(results.monthlyInsurance)}</span>
                </div>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.breakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Total Cost of Loan</span>
                <span className={styles.breakdownValue}>{resultCell("", results.totalCost)}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Total Interest Paid</span>
                <span className={styles.breakdownValue}>{resultCell("", results.totalInterest)}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Loan Amount (Principal)</span>
                <span className={styles.breakdownValue}>{resultCell("", results.principal)}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
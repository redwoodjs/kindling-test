"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./calculator.module.css";
import {
  computeMortgage as calcComputeMortgage,
  parseCurrency,
  formatCurrency,
  type DownPaymentMode,
} from "../../lib/calculator.js";

// ---------------------------------------------------------------------------
// Types (DownPaymentMode and MortgageResults re-exported from lib)
// ---------------------------------------------------------------------------

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
  const results = calcComputeMortgage({
    homePriceRaw: homePrice,
    dpRaw: downPayment,
    dpMode: downPaymentMode,
    interestRateRaw: interestRate,
    loanTermYears,
    taxRaw: propertyTax,
    insuranceRaw: insurance,
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
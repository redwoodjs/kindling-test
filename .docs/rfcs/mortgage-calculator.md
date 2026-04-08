# RFC: Mortgage Calculator Page

**Date**: 2026-04-08
**Status**: Draft (Revision 1)
**Author**: Developer
**Phase**: 2 (RFC — revised per Reviewer feedback)

---

## 2000ft View Narrative

This RFC proposes adding a **Mortgage Calculator** page at `/calculator`. The page is a client-side React component that allows users to explore monthly mortgage payments and total loan costs by adjusting home price, down payment, interest rate, loan term, and optional tax/insurance fields.

The calculator differs from a generic arithmetic tool by serving a specific recurring financial decision — home affordability — and building financial intuition through real-time recalculation. It is purely client-side; no backend or API routes are required.

Users land on the page, see a financial disclaimer, adjust inputs, and immediately see results update without pressing any submit button. The experience is calm and confidence-building rather than alarming, even when payments are high.

---

## Implementation Breakdown

### `[NEW]` `src/app/pages/calculator.tsx`

A `"use client"` React component exporting a named `Calculator` component. The component:

- Manages all input state (home price, down payment amount/percentage, interest rate, loan term, property tax, insurance) using `useState`
- Computes results reactively using derived state (no effects or event handlers needed)
- Formats currency values on blur for price, down payment, tax, and insurance inputs
- Toggles down payment mode between amount and percentage
- Animates result numbers on change using CSS `transition: all 300ms ease-out`
- Shows a financial disclaimer on first load
- Handles edge cases: down payment > home price, extreme values, non-numeric input, division-by-zero guard
- Exports as a named `Calculator` — consistent with existing page component exports (`Home`, `Welcome`)

### `[NEW]` `src/app/pages/calculator.module.css`

CSS Module with:
- CSS custom properties matching the project's design tokens (`--color-baige`, `--color-orange`, etc.) via `@import` from Google Fonts
- Two-column grid layout for inputs (left) and results (right) on desktop (min-width: 768px)
- Single-column vertical stack on mobile (max-width: 767px)
- Animated result value transitions using `ease-out 300ms`
- Disclaimer styling (smaller, muted text)

### `[MODIFY]` `src/worker.tsx`

The `Calculator` page is registered **inside the `render(Document, [...])` array** alongside the existing `route("/", Home)` catch-all. This is the correct pattern for static page components — they must be wrapped in `render(Document, ...)`.

Exact change:

```tsx
import { Calculator } from "@/app/pages/calculator";

export default defineApp([
  setCommonHeaders(),
  // ... setup ...
  route("/status", statusHandler),
  route("/health", { get: healthHandler }),
  route("/ping", { get: pingHandler }),
  render(Document, [
    route("/calculator", Calculator),  // ← added before catch-all
    route("/", Home),
  ]),
]);
```

**Not** a bare `route("/calculator", Calculator)` at the top level of `defineApp` — that would skip the document rendering and produce a raw JSX string. The page component must be inside `render(Document, [...])`.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Mortgage Calculator Page

  # --- Input Defaults ---
  Scenario: Page loads with sensible defaults
    Given the user navigates to /calculator
    Then the page renders a disclaimer stating estimates are not financial advice
    And the home price input is empty (placeholder "e.g. 450,000")
    And the down payment mode defaults to "Percent" showing "20%"
    And the interest rate input is empty (placeholder "e.g. 7")
    And the loan term shows "30 years" pre-selected
    And the results panel shows "--" until all required inputs are valid

  Scenario: Results show "--" when required inputs are incomplete
    Given the user has navigated to /calculator
    And no inputs have been filled
    Then the monthly payment result shows "--"
    And no crash or NaN output occurs

  # --- Required Inputs ---
  Scenario: All required inputs filled with valid values
    Given the user has not entered any values
    When the user enters "500000" as home price
    And the user enters "100000" as down payment amount
    And the user enters "7" as interest rate
    And the user selects "30 years" as loan term
    Then the monthly payment result is a positive number
    And the total interest result is a positive number
    And the total cost result is a positive number

  # --- Real-time Recalculation (no submit button) ---
  Scenario: Changing one input instantly updates results
    Given the user has entered valid home price, down payment, rate, and term
    When the user changes the interest rate from "7" to "6"
    Then the monthly payment result updates without any submit action
    And no "Calculate" button is present on the page

  # --- Down Payment: Amount Mode ---
  Scenario: Down payment in dollar amount
    Given the down payment mode is set to "Amount"
    When the user enters "100000" as down payment
    Then the computed result uses $100,000 as the down payment

  # --- Down Payment: Percentage Mode ---
  Scenario: Down payment in percentage
    Given the down payment mode is set to "Percent"
    When the user enters "20" as down payment percentage
    And the home price is "500000"
    Then the effective down payment is "100000" (20% of 500,000)
    And the results reflect the percentage-derived amount

  # --- Down Payment Toggle (amount → percent) ---
  Scenario: User switches from amount to percent mode
    Given the user has entered a down payment of "100000" in amount mode
    And the home price is "500000"
    When the user toggles the mode to "Percent"
    Then the down payment field shows "20%"

  # --- Down Payment Toggle (percent → amount) ---
  Scenario: User switches from percent to amount mode
    Given the user has entered a down payment of "20%" in percent mode
    And the home price is "500000"
    When the user toggles the mode to "Amount"
    Then the down payment field shows "$100,000"

  # --- Home Price Change Recomputes Down Payment in Percent Mode ---
  Scenario: Home price changes while in percent mode
    Given the down payment mode is set to "Percent"
    And the current down payment is "20%"
    And the home price is "500000"
    When the user changes the home price to "400000"
    Then the effective down payment becomes "80000" (20% of 400,000)
    And the percentage field remains "20%"

  # --- Down Payment Percentage Exactly 100% ---
  Scenario: Down payment is 100% of home price
    Given the down payment mode is set to "Percent"
    And the home price is "500000"
    When the user enters "100" as down payment percentage
    Then no error appears
    And the results show a monthly payment of $0 (no principal, no interest)

  # --- Down Payment Percentage Exceeds 100% ---
  Scenario: Down payment percentage is greater than 100%
    Given the down payment mode is set to "Percent"
    And the home price is "500000"
    When the user enters "150" as down payment percentage
    Then an inline error appears below the down payment field
    And the results panel shows "--" for all values

  # --- Currency Formatting on Blur ---
  Scenario: Blurring a price input formats it as currency
    Given the user has entered "500000" in the home price field
    When the user tabs or clicks away from the field
    Then the field displays "$500,000" (comma formatted)
    And the underlying numeric value remains 500000

  Scenario: Blurring a currency input strips formatting for calculation
    Given the home price field displays "$500,000"
    When the calculation runs
    Then the numeric value used is 500000 (commas stripped)

  # --- Optional Fields: Property Tax ---
  Scenario: Tax field left empty
    Given the user has entered all required inputs
    And the property tax field is empty
    Then the monthly payment shown is principal and interest only
    And the results note "excludes property tax and insurance"

  Scenario: Tax field filled
    Given the user has entered all required inputs
    And the user enters "6000" as annual property tax
    Then the monthly payment includes the tax estimate
    And the monthly tax line shows "$500/mo"

  # --- Optional Fields: Insurance ---
  Scenario: Insurance field filled
    Given the user has entered all required inputs
    And the user enters "1800" as annual insurance
    Then the monthly payment includes the insurance estimate
    And the monthly insurance line shows "$150/mo"

  # --- Error: Down Payment Exceeds Home Price ---
  Scenario: Down payment amount greater than home price
    Given the home price is "300000"
    When the user enters "400000" as down payment amount
    Then an inline error appears below the down payment field
    And the results panel shows "--" for all values
    And no crash or NaN output occurs

  # --- Error: Home Price is Zero ---
  Scenario: Home price set to zero
    Given the user has not entered any values
    When the user enters "0" as home price
    Then an inline error appears below the home price field
    And the results panel shows "--" for all values

  # --- Error: Home Price Exceeds Maximum ---
  Scenario: Home price exceeds 100 million
    Given the user has not entered any values
    When the user enters "150000000" as home price
    Then an inline error appears below the home price field
    And the results panel shows "--" for all values

  # --- Error: Loan Term Less Than 1 Year ---
  Scenario: Loan term set to 0.5 years
    Given the user has entered valid home price and down payment
    When the user enters "0.5" as a custom loan term
    Then an inline error appears below the loan term field
    And the results panel shows "--" for all values

  # --- Error: Interest Rate is Negative ---
  Scenario: Interest rate is negative
    Given the user has entered valid other inputs
    When the user enters "-5" as interest rate
    Then an inline error appears below the rate field
    And the results panel shows "--" for all values

  # --- Error: Interest Rate Exceeds 30% ---
  Scenario: Interest rate is greater than 30%
    Given the user has entered valid other inputs
    When the user enters "35" as interest rate
    Then an inline error appears below the rate field
    And the results panel shows "--" for all values

  # --- Error: Interest Rate Below 0.1% ---
  Scenario: Interest rate is below the minimum threshold
    Given the user has entered valid other inputs
    When the user enters "0.05" as interest rate
    Then an inline error appears below the rate field
    And the results panel shows "--" for all values

  # --- Error: Non-numeric Input ---
  Scenario: User types non-numeric characters in a numeric field
    Given the user has focused on the home price field
    When the user types "abc" into the field
    Then the field value is retained as "abc" (controlled input)
    And the results panel shows "--" for all values
    And no crash occurs

  # --- Financial Disclaimer ---
  Scenario: Disclaimer is visible on first load
    Given the user navigates to /calculator
    Then a disclaimer is visible stating results are estimates only and do not constitute financial advice

  # --- Responsive Layout: Mobile ---
  Scenario: Page layout stacks vertically on mobile
    Given the viewport width is 375px
    When the user navigates to /calculator
    Then the inputs panel is stacked above the results panel
    And no horizontal overflow occurs
    And all input fields are full-width

  # --- Monthly Payment Animation ---
  Scenario: Result number animates on change
    Given the user has entered valid inputs
    When the user changes the home price
    Then the monthly payment number transitions smoothly to the new value
    And the animation uses ease-out timing over 300ms

  # --- Custom Loan Term Values ---
  Scenario: Custom loan term within valid range
    Given the user has entered valid required inputs
    When the user types "25" as a custom loan term
    Then no error appears
    And the results reflect a 25-year loan

  Scenario: Custom loan term exceeds maximum
    Given the user has entered valid required inputs
    When the user types "45" as a custom loan term
    Then an inline error appears below the loan term field
    And the results panel shows "--" for all values

  # --- Long Loan Term: Total Interest Exceeds Principal ---
  Scenario: 40-year loan at 7% shows high total interest
    Given the home price is "500000"
    And the down payment is "100000"
    And the interest rate is "7"
    And the loan term is "40 years"
    Then the monthly payment result is a positive number
    And the total interest paid exceeds the original principal
    And no overflow or NaN occurs
```

---

## Types & Data Structures

```typescript
// Down payment mode toggle
type DownPaymentMode = "amount" | "percent";

// Loan term: presets are 15 | 20 | 30 years; custom values must be
// in the range [1, 40] and are stored as plain numbers.
type LoanTermPreset = 15 | 20 | 30;
type LoanTermYears = LoanTermPreset | number; // custom ∈ [1, 40]

// Input state — all fields managed by useState
interface CalculatorInputs {
  homePrice: string;             // Raw string from the input
  downPayment: string;          // Raw string, mode-dependent
  downPaymentMode: DownPaymentMode;
  interestRate: string;         // Raw string, annual percentage (e.g. "7" = 7%)
  loanTermYears: number;        // Parsed, ∈ [1, 40], default 30
  propertyTax: string;          // Annual amount, raw string
  insurance: string;             // Annual amount, raw string
}

// Computed results — derived on every render, never stored
interface MortgageResults {
  monthlyPI: number;             // Principal & interest only
  monthlyTax: number;             // propertyTax / 12; 0 if field empty/invalid
  monthlyInsurance: number;       // insurance / 12; 0 if field empty/invalid
  monthlyTotal: number;           // monthlyPI + monthlyTax + monthlyInsurance
  totalCost: number;              // monthlyTotal × loanTermMonths (rounded)
  totalInterest: number;          // totalCost − principal
  principal: number;              // homePrice − downPayment
  hasError: boolean;              // True if any required field has an error
  errorField?: "homePrice" | "downPayment" | "interestRate" | "loanTerm";
  errorMessage?: string;          // Human-readable error for the first invalid field
}
```

---

## Invariants & Constraints

1. **Home price range**: Must be > 0 and <= 100,000,000. Zero shows an error. Exceeding 100M shows an error. Empty is valid (shows "--" in results).

2. **Down payment**: Must be >= 0. In "amount" mode, must be <= home price — exceeding home price shows an inline error. In "percent" mode, must be 0–100% — exceeding 100% shows an inline error.

3. **Interest rate range**: Must be between 0.1% and 30%. Below 0.1% (including 0 or negative) triggers an error. Above 30% triggers an error.

4. **Loan term range**: Must be >= 1 year and <= 40 years. Zero or fractional values < 1 trigger a "minimum 1 year" error. Values > 40 trigger a "maximum 40 years" error.

5. **Optional fields**: Property tax and insurance default to 0 when empty or invalid. When provided, they are divided by 12 for the monthly estimate. The results note "excludes property tax and insurance" when both are zero.

6. **Currency parsing**: All currency inputs strip `$`, `,`, and whitespace before parsing. If parsing yields `NaN`, the field is treated as 0 (which triggers a required-field error for mandatory fields).

7. **Error precedence**: When multiple fields have errors, show only the first error by form order: home price, down payment, interest rate, loan term. The error applies to the first invalid field only.

8. **Results display**: When `hasError` is true, all result values show "--". Never show `NaN`, `Infinity`, or a negative number.

9. **Route ordering**: The `/calculator` route is registered inside `render(Document, [...])` before the catch-all `route("/", Home)`. This prevents the catch-all from shadowing `/calculator`.

10. **Fonts**: The component loads Playfair Display (headings) and Noto Sans (body) via `@import` in the CSS Module, matching the established pattern.

11. **Export naming**: The component is a named export (`export const Calculator = ...`), consistent with `Home` and `Welcome` in the existing pages.

---

## Rounding Strategy

All monetary values are rounded to **two decimal places (cents)** for display. This applies to:
- `monthlyPI`, `monthlyTax`, `monthlyInsurance`, `monthlyTotal` — rounded to nearest cent
- `totalCost`, `totalInterest`, `principal` — rounded to nearest cent

The standard amortization formula produces a constant monthly payment such that the final payment may be slightly different from all others (due to floating-point rounding). The calculator uses a **fixed payment for all months**: the computed monthly payment is applied to all months uniformly. This means `totalCost = monthlyTotal × loanTermMonths` may differ slightly from the mathematically exact total paid over the loan's life. This discrepancy is accepted — the fixed-payment approach is the standard industry convention and is simpler to verify.

Intermediate calculations (the compound factor `(1+r)^n`) use full floating-point precision; rounding occurs only at the final display step.

---

## Animation Specification

Result number transitions use CSS `transition: all 300ms ease-out` on the result value containers. The easing curve is `ease-out` (starts fast, ends slow) — no JavaScript animation library is needed. The animation applies only when the numeric value changes; it does not replay on initial page load.

---

## Tasks

- [ ] Create `src/app/pages/calculator.tsx` — component, state, calculation logic, error handling, currency formatting
- [ ] Create `src/app/pages/calculator.module.css` — layout, typography, responsive breakpoint, animations
- [ ] Modify `src/worker.tsx` — add `route("/calculator", Calculator)` inside `render(Document, [...])`, before the catch-all
- [ ] Run `npm run types` and confirm clean
- [ ] Create `src/lib/calculator.test.ts` — unit tests for calculation logic (rounding, edge cases, error detection)
- [ ] Run `npm test` and confirm all tests pass
- [ ] Open `/calculator` in dev server and verify visually (manual verification)

---

## Relevant Learnings & Decisions

- **Route registration**: Page components must be inside `render(Document, [...])`, not as bare `route(...)` at the top level. A bare route skips document rendering and returns raw JSX. Confirmed by examining `worker.tsx` pattern.
- **No backend required**: Pure client-side component. No API route or database access.
- **CSS import pattern**: Google Fonts loaded via `@import` in the CSS Module, as seen in `welcome.module.css`. Uses `--color-baige`, `--color-orange`, etc. custom properties.
- **Calculation formula**: Standard amortization — P[r(1+r)^n]/[(1+r)^n-1] where P = principal, r = monthly rate (annual/12), n = total months.
- **Export convention**: Named export (`Calculator`) matches existing `Home` and `Welcome` pattern (both are named exports in their respective files).
- **No animation library**: CSS `transition: all 300ms ease-out` on result containers — no external dependency.
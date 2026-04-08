# RFC: Mortgage Calculator Page

**Date**: 2026-04-08
**Status**: Draft
**Author**: Developer
**Phase**: 2 (RFC)

---

## 2000ft View Narrative

This RFC proposes adding a **Mortgage Calculator** page at `/calculator`. The page is a client-side React component that allows users to explore monthly mortgage payments and total loan costs by adjusting home price, down payment, interest rate, loan term, and optional tax/insurance fields.

The calculator differs from a generic arithmetic tool by serving a specific recurring financial decision — home affordability — and building financial intuition through real-time recalculation and a sensitivity breakdown. It is purely client-side; no backend or API routes are required.

Users land on the page, see a financial disclaimer, adjust inputs, and immediately see results update without pressing any submit button. The experience is calm and confidence-building rather than alarming, even when payments are high.

---

## Implementation Breakdown

### `[NEW]` `src/app/pages/calculator.tsx`

A `"use client"` React component exporting a named `Calculator` component. The component:

- Manages all input state (home price, down payment amount/percentage, interest rate, loan term, property tax, insurance) using `useState`
- Computes results reactively using derived state (no effect or event handlers needed)
- Formats currency values on blur for price, down payment, tax, and insurance inputs
- Toggles down payment mode between amount and percentage
- Animates result numbers on change using a count-up effect
- Shows a financial disclaimer on first load
- Handles edge cases: zero term, down payment > home price, extreme values, non-numeric input
- Adopts the project font palette (Playfair Display + Noto Sans, loaded via CSS `@import`)

### `[NEW]` `src/app/pages/calculator.module.css`

CSS Module with:
- CSS custom properties matching the project's design tokens (--color-baige, --color-orange, etc.) via `@import` from Google Fonts
- Two-column grid layout for inputs (left) and results (right) on desktop
- Single-column vertical stack on mobile (max-width breakpoint)
- Animated result value transitions
- Disclaimer styling (smaller, muted text)

### `[MODIFY]` `src/worker.tsx`

Add a `route("/calculator", Calculator)` entry in the `defineApp` array **before** the catch-all `route("/", Home)`. The `Calculator` component is rendered directly as a route — no `render(Document, ...)` wrapping is needed since the page's root element handles styling.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Mortgage Calculator Page

  # --- Input Defaults ---
  Scenario: Page loads with sensible defaults
    Given the user navigates to /calculator
    Then the page renders a disclaimer stating estimates are not financial advice
    And the home price input shows a placeholder of "e.g. 450,000"
    And the down payment input shows "20%"
    And the interest rate input shows "7"
    And the loan term shows "30 years" selected
    And the results panel shows a monthly payment of "$0" until all required inputs are valid

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
    Then the monthly payment result updates within 50ms
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

  # --- Down Payment Toggle ---
  Scenario: User switches between amount and percentage modes
    Given the user has entered a down payment of "100000" in amount mode
    And the home price is "500000"
    When the user toggles the mode to "Percent"
    Then the down payment field shows "20%"
    When the user toggles the mode back to "Amount"
    Then the down payment field shows "$100,000"

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

  # --- Error: Zero Loan Term ---
  Scenario: Loan term is zero or blank
    Given the user has entered valid home price and down payment
    When the user sets the loan term to "0"
    Then an inline error appears below the loan term field
    And the results panel shows "--" for all values
    And no division-by-zero crash occurs

  # --- Error: Extreme Interest Rate (negative or > 30%) ---
  Scenario: Interest rate is negative
    Given the user has entered valid other inputs
    When the user enters "-5" as interest rate
    Then an inline error appears below the rate field
    And the results panel shows "--" for all values

  Scenario: Interest rate exceeds 30%
    Given the user has entered valid other inputs
    When the user enters "35" as interest rate
    Then an inline error appears below the rate field
    And the results panel shows "--" for all values

  # --- Error: Non-numeric Input ---
  Scenario: User types non-numeric characters in a numeric field
    Given the user has focused on the home price field
    When the user types "abc" into the field
    Then the field value remains "abc" (controlled input)
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
    Then the monthly payment number smoothly transitions to the new value
    And the animation duration is approximately 300ms
```

---

## Types & Data Structures

```typescript
// Input state — all fields managed by useState
interface CalculatorInputs {
  homePrice: string;           // Raw string from the input (before parsing)
  downPayment: string;         // Raw string, mode-dependent
  downPaymentMode: "amount" | "percent";
  interestRate: string;        // Raw string, percentage as number (e.g. "7" = 7%)
  loanTermYears: number;       // Parsed number, one of [15, 20, 30] or custom
  propertyTax: string;         // Annual, raw string
  insurance: string;           // Annual, raw string
}

// Computed results — derived from inputs, never stored
interface MortgageResults {
  monthlyPI: number;           // Principal & interest only
  monthlyTax: number;          // 0 if propertyTax is empty/invalid
  monthlyInsurance: number;    // 0 if insurance is empty/invalid
  monthlyTotal: number;        // PI + tax + insurance
  totalCost: number;           // All payments over loan life
  totalInterest: number;      // totalCost - (homePrice - downPayment)
  principalPaid: number;       // homePrice - downPayment
  hasError: boolean;          // True if any required field is invalid
  errorMessage?: string;      // Human-readable error for the first invalid field
}

// Down payment mode toggle
type DownPaymentMode = "amount" | "percent";

// Loan term preset
type LoanTermPreset = 15 | 20 | 30;
```

---

## Invariants & Constraints

1. **Home price range**: Must be > 0 and <= 100,000,000. Empty is valid (shows "--").
2. **Down payment**: Must be >= 0. When mode is "amount", must be <= home price. When mode is "percent", must be between 0% and 100%.
3. **Interest rate range**: Must be between 0.1% and 30%. Negative or >30% triggers an error.
4. **Loan term range**: Must be >= 1 year and <= 40 years. Zero triggers a division-by-zero guard.
5. **Optional fields**: Property tax and insurance default to 0 when empty. When provided, they are divided by 12 for monthly estimate.
6. **Currency parsing**: All currency inputs strip `$`, `,`, and whitespace before parsing. If parsing yields `NaN`, treat field as 0.
7. **Error precedence**: When multiple fields have errors, show only the first error (top of form order: home price, down payment, interest rate, loan term).
8. **Results display**: When `hasError` is true, all result values show "--". Never show `NaN` or `Infinity`.
9. **Route ordering**: The `/calculator` route must be registered before `route("/", Home)` in `defineApp` to avoid the catch-all shadowing it.
10. **Fonts**: The component uses Playfair Display (headings) and Noto Sans (body) — loaded via `@import` in the CSS Module, matching the pattern in `welcome.module.css`.

---

## Tasks

- [ ] Create `src/app/pages/calculator.tsx` — component, state, calculation logic, error handling, currency formatting
- [ ] Create `src/app/pages/calculator.module.css` — layout, typography, responsive breakpoint, animations
- [ ] Modify `src/worker.tsx` — add `route("/calculator", Calculator)` before the catch-all `route("/", Home)`
- [ ] Run `npm run types` and confirm clean
- [ ] Create `src/lib/calculator.test.ts` — unit tests for calculation logic
- [ ] Run `npm test` and confirm all tests pass
- [ ] Open `/calculator` in dev server and verify visually (manual verification)

---

## Relevant Learnings & Decisions

- **No backend required**: This is a pure client-side component. No API route or database access. Route is registered as a page render, not a handler.
- **Route shadowing**: The `route("/", Home)` catch-all must come after the `/calculator` route. Verified from existing `worker.tsx` pattern.
- **CSS import pattern**: Google Fonts loaded via `@import` in the CSS Module, as seen in `welcome.module.css`. Uses `--color-baige`, `--color-orange`, etc. custom properties.
- **Calculation formula**: Standard amortization formula — monthly payment = P[r(1+r)^n]/[(1+r)^n-1] where P = principal (price - down), r = monthly rate (annual/12), n = total months.
- **No animation library**: Simple CSS transitions on numeric result text — no external animation dependency needed.
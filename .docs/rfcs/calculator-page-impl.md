# RFC: Calculator Page — Implementation Plan

**Date**: 2026-04-08
**Status**: Draft
**Parent**: `.docs/rfcs/calculator-page.md`

---

## 2000ft View Narrative

A basic arithmetic calculator renders at `/calculator` as a fully client-side React component. No API calls, no server state — pure React with `useState`. The design carries the project's existing visual identity: Playfair Display for the large result display, Noto Sans for buttons, warm beige and orange palette. A two-line display shows a live expression above the result, so users verify intent before committing. Five button categories (utility, operator, equals, digit, sign) are color-coded so any button is locatable by color alone. Division by zero, overflow, and consecutive operators produce the word `Error` in the display and reset silently on the next input — matching the behavior of a physical calculator.

The component is the sole occupant of its page, centered, capped at 420px, fully responsive via CSS Grid. Keyboard support is wired from the outset, including ARIA labels and WCAG AA contrast throughout.

---

## Implementation Breakdown

| Action | File |
|---|---|
| [NEW] | `src/app/pages/calculator.tsx` — calculator page component |
| [NEW] | `src/app/pages/calculator.module.css` — all styles, co-located |
| [NEW] | `src/app/pages/calculator.test.ts` — behavioral unit tests |
| [MODIFY] | `src/worker.tsx` — add `route("/calculator", Calculator)` inside `render()` |

No existing files are deleted. The `welcome.tsx` page is unaffected.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Calculator
  Background:
    Given the calculator is mounted at /calculator

  Rule: Digit entry
    When the user presses digit "7"
    Then the display shows "7"
    When the user presses digit "3"
    Then the display shows "73"

    When the display is "875" and the user presses a digit
    Then the display resets to that digit (result-displayed state clears)

  Rule: Decimal entry
    When the user presses digit "5" then digit "."
    Then the display shows "5."
    When the user presses digit "6"
    Then the display shows "5.6"

    When the display already contains "." and the user presses "."
    Then the display is unchanged

    When the display is "0" and the user presses "."
    Then the display shows "0."

  Rule: Operators
    When the user enters "125" then presses "+"
    Then the expression shows "125 +"
    And the display shows "125"
    And the operator is stored as pending

    When an operator is pending and the user presses a different operator
    Then the first operator is replaced (no calculation occurs)

  Rule: Equals — basic operations
    When the user enters "125" then "+" then "7" then "="
    Then the expression shows "125 + 7 ="
    And the display shows "132"

    When the user enters "10" then "−" then "3" then "="
    Then the expression shows "10 − 3 ="
    And the display shows "7"

    When the user enters "4" then "×" then "7" then "="
    Then the expression shows "4 × 7 ="
    And the display shows "28"

    When the user enters "20" then "÷" then "4" then "="
    Then the expression shows "20 ÷ 4 ="
    And the display shows "5"

  Rule: Equals — edge cases
    When the user presses "=" with no operator pending
    Then the display is unchanged

    When the user enters "5" then "+" then "3" then "=" then "="
    Then the second "=" adds 3 to the previous result (chained calculation)

  Rule: Clear
    When the user enters "125" then "+" then "7"
    And the user presses "C"
    Then the display shows "0"
    And the expression is empty
    And no operator is pending

  Rule: Backspace
    When the user enters "125"
    And the user presses backspace
    Then the display shows "12"
    And pressing backspace again shows "1"
    And pressing backspace again shows "0"

  Rule: Percent
    When the user enters "50" and presses "%"
    Then the display shows "0.5"

  Rule: Sign toggle
    When the user enters "7" and presses "+/−"
    Then the display shows "-7"
    When the user presses "+/−" again
    Then the display shows "7"

  Rule: Error — division by zero
    When the user enters "5" then "÷" then "0" then "="
    Then the display shows "Error"
    And the expression is empty
    And the next digit press resets the machine

  Rule: Error — overflow
    When the user enters "1e+309" then "+" then "1" then "="
    Then the display shows "Error"

  Rule: Floating-point precision
    When the user enters "0.1" then "+" then "0.2" then "="
    Then the display shows "0.3"

  Rule: Keyboard shortcuts
    When the user types "125" on the keyboard
    Then the display shows "125"
    When the user types "+"
    Then the operator is stored
    When the user types "7"
    Then the display shows "7"
    When the user presses "Enter"
    Then the expression shows "125 + 7 ="
    And the display shows "132"

    When the user presses "Escape"
    Then the display shows "0"
    And the expression is empty
    When the user presses "Backspace"
    Then the expression is already empty (no-op)

  Rule: Accessibility
    When any button is focused
    Then it has a visible focus ring
    And its aria-label describes its action
    When the result changes
    Then the display has role="display" and aria-live="polite"
```

---

## Types & Data Structures

### State

```ts
type CalcState = {
  display: string;          // what appears in the result line
  expression: string;        // what appears in the expression line (e.g. "125 + 7")
  storedOperand: number | null;
  pendingOperator: Operator | null;
  resultDisplayed: boolean;  // true after pressing "="; next digit starts fresh
  isError: boolean;          // true after Error; next input resets machine
};

type Operator = "+" | "−" | "×" | "÷";
```

### Pure functions (calculator logic)

```ts
// Rounds to at most 10 significant decimal digits, then formats for display.
// Strips trailing zeros after the decimal point.
function formatResult(n: number): string;

// Returns the next CalcState after a digit key is pressed.
// Handles result-displayed reset and leading-zero suppression.
function applyDigit(state: CalcState, digit: string): CalcState;

// Applies the pending operator to storedOperand and currentOperand.
// Used for both live preview and commit on "=".
function compute(stored: number, op: Operator, current: number): number;
```

### Error sentinel

Division by zero and overflow both produce `Infinity` or `-Infinity` from JavaScript arithmetic. These are detected immediately after `compute()` and mapped to `{ ...state, isError: true, display: "Error" }`.

---

## Invariants & Constraints

1. The expression line is capped at 30 characters in the display; if the formatted expression exceeds this, the result line still shows the full value.
2. The display string never exceeds 15 characters; long results use scientific notation.
3. No `eval`, `new Function`, or `innerHTML` — all rendering is React JSX.
4. `aria-live="polite"` is set on the display so screen readers announce result changes without interrupting.
5. The component uses `useRef` for the keyboard listener cleanup and `useEffect` for focus-on-mount.
6. The component uses `useCallback` for all event handlers to avoid unnecessary re-renders.
7. The CSS class naming follows the established convention: kebab-case in the `.module.css` file, accessed as `styles.container` etc. in JSX.

---

## Tasks

- [ ] Create `src/app/pages/calculator.tsx` with the full calculator component
- [ ] Create `src/app/pages/calculator.module.css` with all styles matching the design palette
- [ ] Add `route("/calculator", Calculator)` inside `render(Document, [...])` in `src/worker.tsx`
- [ ] Create `src/app/pages/calculator.test.ts` covering all Gherkin scenarios above
- [ ] Run `npm run types` and `npm run test`; address any failures
- [ ] Verify the page renders at `/calculator` with `npm run dev` (live verification)

---

## Relevant Learnings & Decisions

| Source | How it informs this plan |
|---|---|
| `.docs/rfcs/calculator-page.md` | Full UX spec: layout, button taxonomy, error behavior, keyboard mapping |
| `src/app/pages/welcome.tsx` + `welcome.module.css` | CSS Modules pattern, co-location convention, color palette via CSS vars |
| `src/worker.tsx` | React page routes live inside `render(Document, [...])`; routes use lowercase verb keys |
| `.docs/learnings/rwsdk-route-method-verbs.md` | Verbs must be lowercase strings (e.g. `get: fn`); confirmed no special action needed here as the calculator page uses the default GET handler |
| `.docs/learnings/typescript-ts-extension-imports.md` | Files may import `.ts` extensions where needed (e.g. `from "./welcome.js"`) |
| `package.json` scripts | Tests run via `node --import tsx --test 'src/**/*.test.ts'`; type check via `tsc` |

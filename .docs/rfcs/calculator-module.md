# RFC: Add Calculator Module

**Date:** 2026-04-10
**Status:** Draft

---

## 2000ft View

This RFC proposes adding a new `src/lib/calculator.ts` module that exposes two pure arithmetic functions — `add` and `subtract` — as a small, focused, self-contained utility. The module earns trust through relentless predictability: binary signatures, `number` return types, and no side effects. It slots cleanly into the existing codebase with no route registration and no dependencies.

A deliberate design question arose during ideation: the existing `src/lib/math.ts` already exports `add` and `subtract`. This RFC resolves that question by creating a new module rather than extending `math.ts`. The rationale is below.

---

## Architectural Decision: Why a New Module

**Option A — Create `calculator.ts` (adopted):** Keeps `math.ts` narrow and stable. The new module owns its own API surface, tests, and documentation. No risk to existing `math.ts` behavior.

**Option B — Extend `math.ts`:** Adds code to a file with existing tests, risking regressions. `math.ts` also includes `multiply`; adding calculator-specific semantics (like floating-point documentation) there would couple two different concerns.

The Ideator recommended Option A. This RFC adopts it.

---

## Implementation Breakdown

**[NEW] `src/lib/calculator.ts`**
Export two functions: `add(a: number, b: number): number` and `subtract(a: number, b: number): number`. Both are pure functions with no side effects. The module docstring will note floating-point precision as a known JavaScript behavior.

**[NEW] `src/lib/calculator.test.ts`**
Unit tests for `add` and `subtract` using Node's built-in `node:test` runner and `node:assert`, following the pattern in `src/lib/math.test.ts`. Tests cover the happy path, negative operands, zero, and negative results.

**No route registration.** The module lives in `src/lib/` as a pure utility. No changes to `src/worker.tsx`.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Calculator module

  Scenario: Adding two positive numbers
    Given two positive numbers, a and b
    When add(a, b) is called
    Then the result equals a + b

  Scenario: Adding a positive and a negative number
    Given a positive number and a negative number
    When add(a, b) is called
    Then the result equals a + b (standard arithmetic)

  Scenario: Adding two negative numbers
    Given two negative numbers, a and b
    When add(a, b) is called
    Then the result equals a + b

  Scenario: Adding zero
    Given zero and any number
    When add(a, b) is called
    Then the result equals the non-zero operand

  Scenario: Subtracting two numbers
    Given two numbers a and b
    When subtract(a, b) is called
    Then the result equals a - b

  Scenario: Subtracting resulting in a negative number
    Given a smaller minuend than subtrahend (e.g., 3 - 7)
    When subtract(a, b) is called
    Then the result is a negative number (mathematically correct)

  Scenario: Subtracting zero
    Given zero and any number
    When subtract(a, b) is called
    Then the result equals the minuend

  Scenario: Subtracting a negative number
    Given a number and a negative number
    When subtract(a, b) is called
    Then the result equals a minus the absolute value of b
```

---

## Types & Data Structures

```typescript
// Binary add — two numbers in, one number out
function add(a: number, b: number): number;

// Binary subtract — two numbers in, one number out
function subtract(a: number, b: number): number;
```

No additional types or data structures. Both functions operate on JavaScript's native `number` primitive.

---

## Invariants & Constraints

1. **Pure functions** — no side effects, no external state, no network, no logging. Given the same inputs, always return the same output.
2. **Binary signatures** — each function accepts exactly two parameters; no optional parameters, no overloads, no defaults.
3. **Return type is `number`** — no `null`, no `undefined`, no throw.
4. **No error surface** — passing `NaN`, `Infinity`, or non-numbers produces the expected JavaScript arithmetic result. Callers who need validation can wrap the functions.
5. **No route registration** — `calculator.ts` is a pure utility in `src/lib/`, not an HTTP handler. It does not touch `src/worker.tsx`.
6. **Floating-point precision** — documented in the module docstring as a known JavaScript behavior, not corrected. `0.1 + 0.2 !== 0.3` in JS; this is intentional.
7. **No duplication of `math.ts`** — the new module has its own identity and is not a wrapper or alias for the existing `math.ts` exports.

---

## Tasks

- [ ] Create `src/lib/calculator.ts` with `add` and `subtract` functions
- [ ] Write module docstring noting floating-point precision behavior
- [ ] Create `src/lib/calculator.test.ts` with tests covering positive, negative, zero, and negative-result scenarios
- [ ] Run `npm test` — all tests pass
- [ ] Run `npm run types` (type check) — no type errors

---

## Relevant Learnings & Decisions

- **`math.ts` is stable** — it is already tested and used by the project. Extending it with calculator-specific code introduces coupling and regression risk. A new module is the safer path.
- **Test pattern established by `math.test.ts`** — `node:test`, `describe`/`it`, `assert`. Tests live next to the source in `src/lib/`.
- **No route registration** — unlike `ping.ts` and `health.ts` (HTTP handlers), `calculator.ts` is a pure utility. No `worker.tsx` changes.
- **Cloudflare Workers context** — not relevant here; no Worker APIs, no `Request`/`Response`, no runtime dependencies. The module works anywhere JS runs.
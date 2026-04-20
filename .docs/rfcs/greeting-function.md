# RFC: Add Greeting Function

**Date:** 2026-04-20
**Author:** Developer
**Status:** Draft

---

## 2000ft View Narrative

Add a tiny greeting capability that always returns the exact string `hello world`. The goal is to keep the surface area as small as possible so the behavior is deterministic, easy to test, and hard to accidentally complicate later.

This is not a route or UI feature. It is a plain shared utility that can be imported by future code without carrying any side effects or runtime dependencies.

---

## Implementation Breakdown

**[NEW] `src/lib/greeting.ts`**
Export a single pure function that returns the literal string `hello world`. Keep it parameter-free so the behavior cannot drift based on inputs.

**[NEW] `src/lib/greeting.test.ts`**
Add a unit test that imports the function directly and asserts exact string equality.

No other files should change for this feature.

---

## Behavior Spec

```gherkin
Feature: Greeting function

  Scenario: Returns the expected greeting
    Given the greeting function is called
    When it runs
    Then it returns "hello world"

  Scenario: Returns an exact literal value
    Given the greeting function is called
    When it runs
    Then the result matches "hello world" exactly
    And the result has no extra whitespace
    And the result has no extra punctuation
    And the result uses lowercase letters only
```

---

## Types & Data Structures

```ts
// Return shape
string
```

The function has no parameters and no configuration object.

---

## Invariants & Constraints

- The return value must always be the exact literal `hello world`
- The function must be pure and side-effect free
- The function must not require any runtime state, environment variables, or I/O
- The function should stay parameter-free unless a future requirement explicitly expands the contract

---

## Tasks

- [ ] Create a pure greeting function in a shared library location
- [ ] Export it for direct import by callers
- [ ] Add a unit test that locks down exact equality with `hello world`
- [ ] Verify there are no unintended formatting or casing changes in the result

---

## Relevant Learnings & Decisions

The existing project conventions favor small, testable utilities in shared library space when the behavior is pure and does not belong behind a route. The route-specific documentation for other features was useful only as a contrast: this feature should stay out of the HTTP layer entirely.

The most important decision is to keep the API minimal. The function should return a fixed literal rather than accept input, because the brief only asks for a greeting string and any extra flexibility would add surface area without benefit.

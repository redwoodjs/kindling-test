# RFC: Add a Hello World Greeting Function

**Date:** 2026-04-17
**Author:** Developer
**Status:** Draft

---

## 2000ft View Narrative

Add a tiny greeting capability that returns the exact string `hello world`. The goal is to provide the smallest useful callable surface for a greeting feature without introducing routing, rendering, configuration, or external dependencies. Keeping it as a pure function makes the behavior deterministic, easy to test, and trivial to reuse anywhere else in the app.

This feature is intentionally narrow. The function should have no parameters, no side effects, and no variability in its return value.

## Implementation Breakdown

### `[NEW]` `src/lib/greeting.ts`

Export a zero-argument function that returns the exact string `hello world`.

### `[NEW]` `src/lib/greeting.test.ts`

Add a unit test that asserts the function returns exactly `hello world`.

## Behavior Spec

```gherkin
Feature: Greeting function

  Scenario: Returns the expected greeting
    Given the greeting function is available
    When it is called
    Then it returns "hello world"

  Scenario: Has no configurable inputs
    Given the greeting function is available
    When it is called
    Then it does not require arguments
```

## Types & Data Structures

```ts
function greeting(): string
```

The return value is always the literal string `hello world`.

## Invariants & Constraints

- The function must return exactly `hello world`
- The function must accept no arguments
- The function must be pure and side-effect free
- The function must not depend on time, environment variables, network state, or request context

## Tasks

- [ ] Add the greeting function as a pure utility
- [ ] Add a unit test for the exact return value
- [ ] Run the relevant tests
- [ ] Run type checking if needed for the touched surface

## Relevant Learnings & Decisions

- The repository already uses small pure utilities in the shared library area, which is the right fit for this change.
- Existing tests use Node's built-in test runner with `tsx`, so the new test should follow that convention.
- No existing `.docs/` artifact required changes for this feature because it does not alter routing, rendering, or architecture.

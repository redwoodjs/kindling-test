# RFC: Add Greeting Helper

**Date:** 2026-04-16
**Author:** Developer
**Status:** Draft

---

## 2000ft View Narrative

Add a zero-argument synchronous helper whose only job is to return the exact string `hello world`. The function must be deterministic, side-effect free, and independent of environment, time, or external inputs. The contract is intentionally strict: callers should always get the same literal value back, and tests should assert that with strict equality.

This is a pure helper, not a route or UI change. It follows the existing small-helper pattern already used in the repository for deterministic utilities.

## Implementation Breakdown

**[NEW] `src/lib/greeting.ts`**  
Export a tiny helper that takes no arguments and returns the literal string `hello world`. The implementation should not branch, transform, or compute anything beyond returning that exact value.

**[NEW] `src/lib/greeting.test.ts`**  
Add unit tests that call the helper directly and assert strict equality on the returned value. Include at least one repeat-call check to prove the helper is stable and deterministic.

**[MODIFY] none**  
No existing source files need to change for this feature.

## Behavior Spec

```gherkin
Feature: Greeting helper

  Scenario: Calling the helper returns the expected greeting
    Given the helper is available
    When it is called with no arguments
    Then it returns exactly "hello world"

  Scenario: Repeated calls are deterministic
    Given the helper is available
    When it is called twice
    Then both results are exactly "hello world"
    And both results are strictly equal
```

## Types & Data Structures

```ts
export function greeting(): "hello world"
```

There are no additional data structures. The return contract is a string literal type so the implementation and tests both pin the exact output.

## Invariants & Constraints

- The helper accepts zero arguments.
- The helper is synchronous.
- The helper always returns the exact string `hello world`.
- The helper must not read from the clock, environment, random sources, or any external service.
- The helper must not have side effects.
- Tests must use strict equality on the returned value, not substring or pattern matching.
- No blueprint update is needed because this feature does not alter the HTTP surface or broader architecture.

## Tasks

- [ ] Add the greeting helper in the shared helper layer
- [ ] Add unit tests that assert exact equality and repeat-call determinism
- [ ] Run the test suite and type checks after implementation
- [ ] Confirm no architecture blueprint changes are required

## Relevant Learnings & Decisions

- The repository already favors tiny deterministic helpers for simple behavior, with tests placed close to the source.
- Existing RFCs for small features document the exact contract first and keep the implementation surface minimal.
- The route blueprint is specific to HTTP endpoints, so it does not need to change for a helper-only feature.
- The only documentation addition required for this task is this RFC; existing docs stay otherwise unchanged.

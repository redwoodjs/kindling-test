# RFC: Add Greeting Function

**Date**: 2026-04-17
**Status**: Planned

---

## 2000ft View

Add a minimal greeting helper that returns the plain string `hello world`. The goal is to provide a tiny, predictable function that can be imported and tested directly without introducing any routing, rendering, or runtime concerns. This keeps the change easy to reason about and avoids overbuilding for a requirement that is already fully satisfied by a single pure function.

The intended public behavior is simple: calling the greeting helper returns exactly `hello world`.

## Implementation Breakdown

**[MODIFY] `src/lib/greeting.ts`**
Keep the greeting helper as a pure function that returns the fixed string `hello world`. If any surrounding code diverges from that behavior, normalize it back to the simplest possible implementation.

**[MODIFY] `src/lib/greeting.test.ts`**
Keep or add a direct unit test that asserts the helper returns `hello world` exactly. The test should remain small and should not require any framework or Worker setup.

## Behavior Spec

```gherkin
Feature: Greeting helper

  Scenario: Greeting returns the expected string
    Given the greeting helper is available
    When it is called
    Then it returns "hello world"
```

## Types & Data Structures

No new types are needed. The public contract is a zero-argument function that returns a string literal value.

## Invariants & Constraints

- The return value must be exactly `hello world`
- The helper must remain pure and deterministic
- No I/O, state, or framework integration should be introduced
- The behavior should be directly unit-testable

## Tasks

- [x] Confirm the repository already contains a greeting helper and test covering the requested behavior
- [x] Document the intended minimal contract in this RFC
- [ ] Make code changes only if the implementation drifts from the contract
- [ ] Run the relevant tests and type checks once implementation work is needed

## Relevant Learnings & Decisions

The repository already follows a pattern of keeping small pure helpers in `src/lib/` with direct unit tests alongside them. That makes the greeting request a straightforward fit for the existing structure, and no additional blueprint or architectural update is needed for this tiny behavior.

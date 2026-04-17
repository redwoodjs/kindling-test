# RFC: Add Greeting Helper

**Date**: 2026-04-17
**Status**: Implemented

## 2000ft View Narrative

Add the smallest possible greeting capability: a pure helper that returns the exact string `hello world`. The value of the feature is the contract itself, which is simple enough to reuse anywhere in the codebase without depending on request context, time, or configuration.

Keeping the behavior this small avoids accidental complexity. There is no localization, no parameter handling, no formatting logic, and no side effect, which makes the function trivial to reason about and trivial to verify.

## Implementation Breakdown

- `[NEW]` `src/lib/greeting.ts`
  - Export a no-argument helper that returns the exact greeting string.
- `[NEW]` `src/lib/greeting.test.ts`
  - Add a unit test that asserts the helper returns exactly `hello world`.

## Behavior Spec (Gherkin)

```gherkin
Feature: Greeting helper

  Scenario: Returns the exact greeting
    Given the greeting helper is called
    When the result is observed
    Then the value is exactly "hello world"
```

## Types & Data Structures

```typescript
function greet(): string
```

The helper has no inputs and returns a single string. There are no additional data structures.

## Invariants & Constraints

1. The helper must be pure.
2. The output must be exactly `hello world`.
3. No extra whitespace, punctuation, or capitalization changes are allowed.
4. The helper must not depend on environment state or arguments.

## Tasks

- [x] Record the minimal greeting contract in an RFC
- [ ] Add the greeting helper
- [ ] Add exact-output coverage
- [ ] Run the test suite and type check

## Relevant Learnings & Decisions

The existing codebase already uses small, colocated utility modules with colocated tests for simple behavior. That pattern is the best fit here because the greeting feature is a pure unit-level contract and does not need routing, SSR, or broader application wiring.

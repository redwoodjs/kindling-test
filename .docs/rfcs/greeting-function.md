# RFC: Add Hello World Greeting Helper

**Date:** 2026-04-17
**Status:** Proposed

---

## 2000ft View

Add a tiny, pure helper that always returns the greeting string `hello world`. The goal is to provide the smallest possible implementation for the requested behavior without introducing routing, framework wiring, or extra configuration. Keeping the feature as a standalone helper makes it deterministic, easy to test, and easy to reuse later if another surface needs the same greeting.

This is intentionally not an application route and not a UI change. It is a plain library function with a single responsibility.

---

## Implementation Breakdown

**[NEW]** `src/lib/greeting.ts`  
Export a pure function that returns the fixed greeting string `hello world`. No arguments, no side effects, and no runtime dependencies.

**[NEW]** `src/lib/greeting.test.ts`  
Add a small unit test that asserts the helper returns the expected greeting exactly. The test should follow the existing `node:test` pattern used by the other library helpers.

---

## Behavior Spec

```gherkin
Feature: Greeting helper

  Scenario: Greeting helper returns the fixed string
    Given the helper is called
    When the return value is read
    Then the value is "hello world"
```

---

## Types & Data Structures

No new types are required. The helper returns a plain string value:

```ts
string
```

---

## Invariants & Constraints

- The function must always return the same string.
- The string must be exactly `hello world`.
- The helper must remain pure and side-effect free.
- No routing, SSR, or application startup changes are needed.

---

## Tasks

- [x] Define the simplest helper shape in an RFC
- [ ] Add the greeting helper in the library layer
- [ ] Add a focused unit test for the helper
- [ ] Run the local test suite and type check

---

## Relevant Learnings & Decisions

- Existing library helpers in this project are kept small and tested directly.
- The current test setup already covers files in `src/lib/`, which makes the helper easy to verify without new harness work.
- The requested behavior is deterministic, so no injectable clock, config, or environment hooks are needed.

# RFC: Greeting Helper

**Date:** 2026-04-16
**Author:** Developer
**Status:** Implemented

---

## 2000ft View Narrative

Add one small shared utility that returns the exact string `hello world`. The helper lives in the existing shared utility layer so it can be imported directly by other code without introducing any routing, rendering, or worker-level behavior. The goal is to keep the change narrowly scoped, easy to test, and consistent with the repository's current pattern for pure helpers.

This is intentionally not an HTTP endpoint or UI feature. It is a plain function with no inputs, no side effects, and no dependency on runtime state.

---

## Implementation Breakdown

**[NEW] `src/lib/greeting.ts`**
Export a pure helper, `greet(): string`, that returns the exact string `hello world`.

**[NEW] `src/lib/greeting.test.ts`**
Add a small unit test that imports the helper and asserts the return value is exactly `hello world`.

No worker, route, or SSR changes are required for this feature.

---

## Behavior Spec

```gherkin
Feature: Greeting helper

  Scenario: Returns the exact greeting
    Given the helper is imported
    When it is called
    Then it returns "hello world"

  Scenario: Returns the same value on repeated calls
    Given the helper is imported
    When it is called multiple times
    Then every call returns "hello world"
```

---

## Types & Data Structures

No new data structures are needed.

```ts
function greet(): string
```

The return type is the plain string `hello world`.

---

## Invariants & Constraints

- The helper must return `hello world` exactly, including lowercase letters and the space.
- The helper must not accept parameters.
- The helper must remain pure: no logging, no random values, no time access, and no environment or I/O access.
- The feature must stay in the shared utility layer and must not add routing or SSR surface area.
- The helper test should follow the existing Node test style used by the current utility tests.

---

## Tasks

- [x] Add the new greeting helper in the shared utility layer
- [x] Add a unit test that verifies the exact return value
- [x] Run the relevant checks after implementation
- [x] Confirm no docs or architecture updates are needed beyond this RFC

---

## Relevant Learnings & Decisions

- Consulted `.docs/blueprints/api-routes.md` to confirm this change should not be routed through the worker composition root or SSR pipeline.
- Reviewed the existing shared utility pattern in `src/lib/math.ts` and the matching test style in `src/lib/math.test.ts`; this RFC follows the same small, direct module shape.
- No existing learning document applies directly to this pure helper. Finalization should only check whether the implementation reveals a reusable utility pattern worth promoting, but no blueprint update is expected because there is no routing or rendering change.

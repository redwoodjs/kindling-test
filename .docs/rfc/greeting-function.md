# RFC: Greeting Function

**Date**: 2026-03-25
**Author**: Developer
**Status**: In Review

---

## 2000ft View

We are adding a simple utility function to the shared utilities module that returns the string "hello world". This is a minimal feature that serves as a baseline utility and allows for verification of the project's build, test, and export mechanisms. The function follows existing project conventions for named exports and will be testable via the standard test infrastructure.

---

## Implementation Breakdown

### Files Touched

| File | Change | Notes |
|------|--------|-------|
| `src/app/shared/greeting.ts` | [NEW] | New file containing greeting function |
| `package.json` | [MODIFY] | Add test script if needed for verification |

### Change Details

#### [NEW] `src/app/shared/greeting.ts`

Create a new file exporting a single function:

```typescript
export const getGreeting = (): string => "hello world";
```

This function:
- Returns a string literal "hello world"
- Takes no parameters
- Is a pure function (no side effects)
- Follows the naming convention of existing utilities
- Uses `export const` pattern consistent with `links.ts` and `headers.ts`

#### [MODIFY] `package.json`

If test infrastructure does not yet exist, ensure a test script is available for future test runs. Current state: no test script exists. QA and the test suite will determine if package.json modifications are needed.

---

## Behavior Specification

```gherkin
Feature: Greeting Function
  The greeting function returns a well-defined string

  Scenario: Calling the greeting function
    Given the greeting function is available
    When the function is called with no arguments
    Then it returns the string "hello world"
    And the string is exactly "hello world" (no extra whitespace or case variations)
```

### Behavioral Details

- **Function name**: `getGreeting`
- **Parameters**: None
- **Return type**: `string`
- **Return value**: `"hello world"` (two words, lowercase, single space)
- **Purity**: Function is pure (deterministic, no side effects)
- **Error behavior**: No error handling needed; function always succeeds

---

## Types & Data Structures

### Function Signature

```typescript
export const getGreeting: () => string
```

### Return Value

- **Type**: `string`
- **Value**: `"hello world"`
- **Invariants**:
  - Always returns the exact string "hello world"
  - Never returns null, undefined, or a modified version

---

## Invariants & Constraints

1. **Determinism**: The function must always return the same value.
2. **Purity**: The function has no side effects and does not modify global state.
3. **Consistency**: The returned string must match the requirement exactly: `"hello world"`.
4. **No parameters**: The function signature must not accept any arguments.
5. **Naming convention**: Function name must follow the `get*` naming pattern used elsewhere in the codebase.

---

## Task Checklist

- [ ] Implement greeting function in `src/app/shared/greeting.ts`
- [ ] Verify TypeScript compilation succeeds (`npm run types`)
- [ ] Confirm function is exportable and follows project conventions
- [ ] Await test suite from QA (Phases 5–6)
- [ ] Run tests against implementation (Phase 7)
- [ ] Address any test failures
- [ ] Update project documentation if needed
- [ ] Create PR for review

---

## Relevant Learnings & Decisions

### Project Structure Analysis

- **Location**: Utility functions are placed in `src/app/shared/` alongside other utilities (e.g., `links.ts`)
- **Export pattern**: All utilities use `export const` with named exports
- **Language**: TypeScript throughout; strict typing is enforced via `tsconfig.json`
- **Build system**: Vite handles compilation; no custom build steps needed

### Test Infrastructure

- Currently, no test runner is configured in `package.json`
- QA will determine the appropriate test framework (likely Vitest, given the Vite setup)
- Tests will be independent of this RFC and will verify the function's behavior via external calls

### Design Rationale

1. **No parameters**: The greeting is static and does not require customization.
2. **`getGreeting` naming**: Follows the convention of getter functions in TypeScript (e.g., `getValue`, `getUser`).
3. **String return type**: Simple and unambiguous; no need for union types or complex structures.
4. **Placement in shared utilities**: Makes the function globally accessible and reusable across the app.

---

## Open Questions

- Will test infrastructure (test runner, framework) be added as part of this effort, or deferred?
- Is there a preference for additional utilities to be grouped together in a single file vs. separate files?

---

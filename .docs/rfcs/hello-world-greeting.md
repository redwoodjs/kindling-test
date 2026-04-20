# RFC: Add a Minimal Greeting Function

## 2000ft View Narrative
The feature should provide one stable behavior: calling the greeting capability returns the exact text `hello world`. The goal is to make the smallest possible unit that can be depended on by future callers, examples, or smoke checks without introducing configuration, branching, or side effects.

This should stay intentionally narrow. A deterministic return value keeps the implementation easy to reason about, easy to test, and unlikely to drift as the codebase evolves.
The greeting should live in a dedicated non-React module and be exported as a named function so callers and tests can use the same stable entry point.

## Implementation Breakdown

### [NEW]
- Add a pure greeting function in a dedicated module that returns the literal string `hello world`.
- Add focused tests that import the function directly and assert the exact returned text.

### [MODIFY]
- Expose the named function from the new module as the primary public entry point.
- Update any barrel or export surface only if the repository already uses one for small utility modules.

### [DELETE]
- None.

## Behavior Spec

```gherkin
Feature: Greeting
  Scenario: Return the baseline greeting
    When the greeting function is called
    Then it returns "hello world"

  Scenario: Preserve exact output
    When the greeting function is called repeatedly
    Then the output remains "hello world"
```

## Types & Data Structures
- The function returns a plain string.
- No input is required for the minimal version.
- No additional state, configuration object, or context type is needed.
- The function signature should take no arguments.

## Invariants & Constraints
- The output must be exactly `hello world`.
- The function must be deterministic and side-effect free.
- The implementation should not introduce environment checks, I/O, time dependence, or formatting logic.
- The module should contain only the greeting behavior and no route wiring.
- If the codebase has a utility export pattern, follow it; otherwise, export the function directly from its module.

## Tasks
- [x] Confirm the greeting belongs in a dedicated utility module rather than route wiring.
- [ ] Implement the pure function.
- [ ] Export the function as a named symbol from that module.
- [ ] Add tests covering the exact return value.
- [ ] Run the relevant checks and confirm the feature remains deterministic.

## Relevant Learnings & Decisions
- The existing project guidance favors small, deterministic units with minimal surface area.
- Current repository learnings emphasize keeping behavior pure unless a broader boundary explicitly requires otherwise.
- No additional `.docs/` artifact is required beyond this RFC because the change is isolated and does not alter the broader architecture.

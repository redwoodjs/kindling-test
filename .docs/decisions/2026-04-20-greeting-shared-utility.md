# Decision: Keep Greeting as a Shared Utility

## Context
The greeting feature only needs to return the fixed string `hello world`. It does not need HTTP routing, runtime state, or any side effects.

## Decision
Implement the greeting as a dedicated shared utility in `src/lib/greeting.ts` and verify it with a direct unit test.

## Alternatives Considered
- Route-based implementation: rejected because the feature has no request/response semantics.
- Configurable or parameterized greeting API: rejected because the brief only requires one exact output.

## Consequences
- The behavior stays deterministic and easy to test.
- Future callers can import the helper directly without depending on the SSR or worker route surface.
- The feature remains intentionally small, so any future expansion will need an explicit contract change.

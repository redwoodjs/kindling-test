# Factory Pattern for Testable Time-Dependent Handlers

## Problem

Route handlers that branch on elapsed time (e.g., "warn if uptime > 24h") are difficult to test without either:
- Waiting real time (impractical for 24h thresholds)
- Monkey-patching globals like `Date.now` (brittle, hard to reset, affects other tests)

## Solution

Use a handler factory that accepts the time-reading function as a parameter:

```typescript
export function createHealthHandler(
  getUptimeMs: () => number = defaultGetUptimeMs,
): () => Response {
  return (): Response => {
    if (getUptimeMs() > THRESHOLD) {
      // time-dependent branch
    }
    // ...
  };
}

// Production export — wired to real clock
export const healthHandler = createHealthHandler();
```

Tests inject a stub:

```typescript
// Under threshold
const handler = createHealthHandler(() => 1000);

// Over threshold
const handler = createHealthHandler(() => 25 * 60 * 60 * 1000);

// Exact boundary
const handler = createHealthHandler(() => THRESHOLD);
```

## Benefits

- **No real waiting**: Tests run instantly.
- **No global mutation**: Each test creates an isolated handler; no shared state.
- **Boundary testing is trivial**: Exact threshold, one-ms-under, one-ms-over are all straightforward.
- **Production path unchanged**: The default export uses the real clock; no performance or correctness cost.

## When to Use

Any handler that reads the current time (or any other ambient value) to branch on should use this pattern. The same approach applies to handlers that depend on environment variables, feature flags, or other injected configuration.

## Context

Introduced in the `/health` endpoint implementation. See `src/app/pages/health.ts` for the concrete example.

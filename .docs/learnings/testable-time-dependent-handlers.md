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

## Extending the Pattern: Configurable Threshold

The same factory can also accept the threshold itself as a parameter (with a sensible default), keeping both the time source and the policy injectable:

```typescript
const DEFAULT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function createHealthHandler(
  getUptimeMs: () => number = defaultGetUptimeMs,
  thresholdMs: number = DEFAULT_THRESHOLD_MS,
): () => Response { ... }
```

This makes tests against non-standard thresholds trivial without environment variable plumbing.

## ESM Complement: Mutable-Object Export for Module-Level State

For test cases that need to exercise the *default* code path (i.e., the real `defaultGetUptimeMs` function, not an injected stub), a mutable object export provides a clean ESM-compatible seam:

```typescript
// Export as an object property, not a plain const or let.
// In ESM, consumers can mutate object properties but cannot reassign bindings.
export const START_TIME = { value: Date.now() };

function defaultGetUptimeMs(): number {
  return Date.now() - START_TIME.value;
}
```

Tests save and restore in `beforeEach`/`afterEach`:

```typescript
let savedStartTime: number;
beforeEach(() => { savedStartTime = START_TIME.value; });
afterEach(()  => { START_TIME.value = savedStartTime; });

it("...", async () => {
  START_TIME.value = Date.now() - 25 * 60 * 60 * 1000;
  const handler = createHealthHandler(); // no-arg: uses real defaultGetUptimeMs
  // assert...
});
```

**Why not export `let`?** In ES modules, named `let` exports create live bindings that the exporting module owns — importers can read them but cannot write to them. Wrapping the value in an object sidesteps this restriction cleanly, without needing a dedicated setter function or CommonJS interop.

**Combine both techniques** when you want full coverage: factory-injected stubs for fast isolated unit tests, and `START_TIME` mutation for integration-style tests that go through the full default code path.

## When to Use

Any handler that reads the current time (or any other ambient value) to branch on should use this pattern. The same approach applies to handlers that depend on environment variables, feature flags, or other injected configuration.

## Context

Introduced in the `/health` endpoint implementation. See `src/app/pages/health.ts` for the concrete example. The mutable-object export and configurable threshold were added in a follow-up fix pass to address PR review comments.

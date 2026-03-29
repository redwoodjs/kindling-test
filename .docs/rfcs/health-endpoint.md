# RFC: Add `/health` Endpoint

**Date**: 2026-03-29
**Status**: Implemented

---

## 2000ft View

This RFC proposes adding a `/health` HTTP endpoint to the RedwoodSDK Cloudflare Worker application. The endpoint returns a simple machine-readable liveness signal useful for load balancers, uptime monitors, and operational dashboards. It always returns `200 OK` with `{"healthy": true}`. If the current Worker instance has been running for more than 24 hours, the response also includes a `warning` field recommending a recycle — a common operational pattern for catching memory leaks and stale state.

The endpoint has no authentication, no side effects, and no database access. It is intentionally lightweight.

---

## Implementation Breakdown

### `[NEW]` `src/app/pages/health.ts`

A pure TypeScript module (not a React component) that exports:

- A `HealthResponse` type describing the response shape
- A `START_TIME` object (`{ value: Date.now() }`) holding the module initialization timestamp; exported as a mutable object property so tests can override `START_TIME.value` without monkey-patching globals
- A `createHealthHandler(getUptimeMs, thresholdMs)` factory that accepts an injectable uptime provider and an optional threshold in milliseconds (default: `DEFAULT_THRESHOLD_MS` = 24 h); returns a `RouteMiddleware`-compatible handler
- A `healthHandler` export: `createHealthHandler()` using the real clock and default threshold — this is what gets registered as the route handler

The factory parameters enable full uptime and threshold control in tests without monkey-patching globals.

### `[MODIFY]` `src/worker.tsx`

Add `route("/health", { get: healthHandler })` to the `defineApp` array, placed **before** the `render(Document, [...])` call. This ensures the request is intercepted at the routing layer before the React SSR pipeline attempts to handle it.

Import `healthHandler` from `@/app/pages/health`.

### `[NEW]` `src/lib/health.test.ts`

Tests for both uptime scenarios using the Node.js built-in `node:test` runner and `node:assert`, matching the conventions established in `src/lib/math.test.ts`. Tests call `createHealthHandler` with a controlled `getUptimeMs` mock — no real waiting.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Health endpoint

  Scenario: Server has been running less than 24 hours
    Given the server started less than 24 hours ago
    When a GET request is made to /health
    Then the response status is 200
    And the Content-Type header is "application/json"
    And the response body is {"healthy": true}
    And the response body does not contain a "warning" field

  Scenario: Server uptime exactly equals 24 hours (boundary — not exceeded)
    Given the server uptime is exactly 86400000 milliseconds (24 hours)
    When a GET request is made to /health
    Then the response status is 200
    And the response body is {"healthy": true}
    And the response body does not contain a "warning" field

  Scenario: Server has been running more than 24 hours
    Given the server started more than 24 hours ago
    When a GET request is made to /health
    Then the response status is 200
    And the Content-Type header is "application/json"
    And the response body is:
      {"healthy": true, "warning": "uptime exceeds 24h, consider recycling"}

  Scenario: Non-GET request to /health
    Given a running server
    When a POST request is made to /health
    Then the response status is 405
```

---

## Types & Data Structures

```typescript
// Base response — always present
type HealthResponseBase = {
  healthy: true;
};

// With uptime warning
type HealthResponseWithWarning = HealthResponseBase & {
  warning: "uptime exceeds 24h, consider recycling";
};

type HealthResponse = HealthResponseBase | HealthResponseWithWarning;
```

The `warning` string is a literal type — callers can use `"warning" in response` to check its presence.

---

## Invariants & Constraints

1. **Uptime measurement**: `START_TIME.value` is set to `Date.now()` at module initialization time. This correctly tracks how long the current Worker instance has been alive, which is the meaningful notion of "server uptime" in a Cloudflare Workers environment. The mutable object form (rather than a plain `const`) allows tests to override it; see `.docs/learnings/testable-time-dependent-handlers.md`.

2. **Threshold is strictly greater than 24 hours**: `uptimeMs > 24 * 60 * 60 * 1000`. Exactly 24 hours does NOT trigger the warning (consistent with "exceeds").

3. **No side effects**: The handler is read-only. No logging, no database access, no state mutation.

4. **Response format**: Always `application/json`. Always HTTP 200. The `healthy` field is always `true`.

5. **Method restriction**: Only GET (and HEAD, by HTTP convention) is handled. All other methods return 405, using rwsdk's built-in `MethodHandlers` behavior.

6. **Route position**: The health route must be placed before `render(Document, [...])` in the `defineApp` array. The `render()` wrapper injects SSR middleware, and the health route must bypass it.

---

## Tasks

- [x] Investigate codebase: framework, routing API, test runner, existing patterns
- [x] Create `src/app/pages/health.ts` with `createHealthHandler` factory and `healthHandler` export
- [x] Modify `src/worker.tsx` to register `route("/health", { get: healthHandler })`
- [x] Create `src/lib/health.test.ts` with test cases (normal, >24h, exactly 24h boundary, response structure)
- [x] Run `npm test` and confirm all tests pass
- [x] Run `npm run types` (type check) and confirm clean
- [x] Make threshold configurable (`thresholdMs` parameter, default `DEFAULT_THRESHOLD_MS`)
- [x] Export `START_TIME` as mutable object; add `beforeEach`/`afterEach` tests exercising the default uptime path

---

## Test Strategy: Mocking Uptime

The `createHealthHandler` factory accepts a `getUptimeMs: () => number` argument. Tests construct the handler with a controlled stub:

```typescript
// Under 24h
const handlerNormal = createHealthHandler(() => 1000);

// Over 24h
const TWENTY_FIVE_HOURS_MS = 25 * 60 * 60 * 1000;
const handlerExpired = createHealthHandler(() => TWENTY_FIVE_HOURS_MS);

// Exactly 24h (boundary)
const EXACTLY_24H_MS = 24 * 60 * 60 * 1000;
const handlerBoundary = createHealthHandler(() => EXACTLY_24H_MS);
```

Since the handler returns a `Response`, tests call the handler directly (no HTTP server or Cloudflare runtime required), await the result, and assert on `response.status` and the parsed JSON body.

---

## Relevant Learnings & Decisions

- **No `.docs/` artifacts existed** — this is the first RFC for the project. No prior blueprints or decisions to consult.
- **rwsdk routing**: `route()` accepts `MethodHandlers` objects (`{ get: fn, post: fn, ... }`). The framework automatically returns 405 for unregistered methods.
- **Test runner**: Node.js built-in `node:test` with `tsx` loader. The `npm test` script uses a glob (`src/lib/*.test.ts`) — new test files in `src/lib/` are automatically picked up.
- **Cloudflare Workers uptime**: Workers are ephemeral. Module-level `Date.now()` is the standard idiom for tracking instance uptime.

# RFC: Add /ping Endpoint

**Date:** 2026-03-29
**Status:** Implemented

---

## 2000ft View

Add a `/ping` health-check endpoint that returns `{"pong": true, "timestamp": <unix-ms>}` with HTTP 200. The endpoint has no side effects, requires no authentication, and exists solely as a lightweight liveness signal — useful for uptime monitors, load-balancer probes, and smoke tests. The `timestamp` field carries the server-side millisecond epoch at the time of the response, giving callers a reference clock signal alongside the liveness confirmation.

This is a pure API route: it does not go through the React/RSC rendering pipeline.

---

## Implementation Breakdown

**[MODIFY] `src/worker.tsx`**
Register `route("/ping", { get: pingHandler })` at the top level of `defineApp`, before the `render()` call. Placing it before `render()` ensures the request is intercepted and returned directly without entering the React render pipeline.

**[NEW] `src/lib/ping.ts`**
Export `pingHandler` — a function that returns `Response.json({ pong: true, timestamp: Date.now() })`. Extracting it to `src/lib/` makes it independently testable without mocking the full Worker environment, consistent with how `math.ts` is structured.

**[NEW] `src/lib/ping.test.ts`**
Unit tests for `pingHandler` using Node's built-in `node:test` module, following the pattern established in `src/lib/math.test.ts`.

---

## Behavior Spec

```gherkin
Feature: /ping endpoint

  Scenario: GET /ping returns pong with timestamp
    Given the server is running
    When a GET request is sent to /ping
    Then the response status is 200
    And the response body contains {"pong": true}
    And the response body contains a "timestamp" field that is a positive integer (Unix ms)
    And the Content-Type header contains "application/json"

  Scenario: Non-GET method returns 405
    Given the server is running
    When a POST request is sent to /ping
    Then the response status is 405
```

---

## Types & Data Structures

No new types. The response payload shape:

```ts
{ pong: true; timestamp: number }  // pong is boolean true (not a string); timestamp is Date.now() in ms
```

`Response.json()` is used (available in the Cloudflare Workers runtime), which sets `Content-Type: application/json` automatically.

---

## Invariants & Constraints

- `pong` must be boolean `true`, not the string `"true"`
- `timestamp` must be a number (milliseconds since Unix epoch, via `Date.now()`)
- HTTP status must be 200 on success
- No authentication, no DB access, no side effects
- The route must not interfere with existing routes (especially `/`)
- The 405 behavior on non-GET methods is handled automatically by rwsdk's `MethodHandlers` dispatch when only `get` is defined (the framework returns 405 for unregistered verbs by default, unless `config.disable405` is set)

---

## Tasks

- [x] Create `src/lib/ping.ts` exporting `pingHandler`
- [x] Modify `src/worker.tsx` to register `route("/ping", { get: pingHandler })`
- [x] Create `src/lib/ping.test.ts` with unit tests covering the 200+body, timestamp presence, and Content-Type assertions
- [x] Add `timestamp: Date.now()` to the response body
- [x] Run `pnpm test` — all tests pass
- [x] Run `pnpm types` — no type errors

---

## Relevant Learnings & Decisions

**Route placement:** The `/ping` route must be registered outside (and before) `render(Document, [...])`. The `render()` wrapper injects an RSC/SSR middleware layer that is only appropriate for React page routes. A plain `Response`-returning route registered at the `defineApp` top level is dispatched before that layer is reached.

**Handler extraction to `src/lib/`:** The test script (`node --import tsx --test src/lib/*.test.ts`) only covers files in `src/lib/`. Extracting the handler there is the minimal-friction path to unit testing without needing an integration test harness or Miniflare.

**`Response.json()` vs `new Response(JSON.stringify(...))`:** `Response.json()` is available in the Cloudflare Workers runtime (and in Node ≥ 18) and automatically sets the correct `Content-Type`. It's the idiomatic choice here.

**405 handling:** rwsdk's `MethodHandlers` dispatch returns 405 automatically when a method is not in the handler map (and `config.disable405` is not set). No manual handling needed.

# RFC: `/status` Endpoint

**Date**: 2026-03-29
**Author**: Developer
**Status**: Draft

---

## 2000ft View Narrative

The project needs a lightweight `/status` endpoint that answers "is the server alive and what version is it?" in a machine-readable way. The response carries three fields: the current server time (UTC ISO 8601), the server uptime in whole seconds, and the application version string sourced from `package.json`.

The codebase runs as a Cloudflare Worker under the RedwoodSDK framework (`rwsdk` v1.0.4). Routes are registered via `route(path, handler | methodHandlers)` in `defineApp([...])` inside `src/worker.tsx`. A handler can return either a React Server Component or a plain `Response` object — the latter is used here since `/status` is a JSON API endpoint, not a rendered page.

Cloudflare Workers do not expose `process.uptime()`. Uptime is approximated by capturing `Date.now()` at module initialisation (cold-start time) and subtracting it from `Date.now()` at request time. This is the standard Workers idiom.

The `version` string is read once from `package.json` via a static `import` (TypeScript's `resolveJsonModule` is already enabled). There is no per-request file I/O.

The existing test runner uses Node.js native `node:test` with `tsx`. The current test glob (`src/lib/*.test.ts`) covers only `src/lib/`. It must be broadened to `src/**/*.test.ts` so tests for new handler files can live alongside their source.

---

## Implementation Breakdown

| Tag | File | Purpose |
|-----|------|---------|
| `[NEW]` | `src/app/status.ts` | Status route handler: exports `START_TIME`, `VERSION`, and `statusHandler` |
| `[MODIFY]` | `src/worker.tsx` | Import and register `route("/status", statusHandler)` before the `render(...)` block |
| `[MODIFY]` | `package.json` | Broaden test glob from `src/lib/*.test.ts` to `src/**/*.test.ts` |
| `[NEW]` | `src/app/status.test.ts` | Unit tests for the status handler logic |

---

## Behavior Spec (Gherkin)

```gherkin
Feature: GET /status

  Scenario: Returns 200 with JSON content-type
    Given the server is running
    When I send GET /status
    Then the response status is 200
    And the Content-Type header contains "application/json"

  Scenario: Response body has the correct shape
    Given the server is running
    When I send GET /status
    Then the response body is valid JSON
    And the body contains a field "time" that is a string
    And the body contains a field "uptime" that is a non-negative number
    And the body contains a field "version" that is a non-empty string

  Scenario: "time" is a valid ISO 8601 UTC timestamp
    Given the server is running
    When I send GET /status
    Then the "time" field parses successfully as a Date
    And the "time" field ends with "Z"

  Scenario: "uptime" increases over time
    Given the server has been running for at least 1 second
    When I send GET /status twice with 1 second between requests
    Then the second "uptime" value is greater than the first

  Scenario: "version" matches package.json
    Given the server is running
    When I send GET /status
    Then the "version" field equals "1.0.0"

  Scenario: Non-GET methods are rejected
    Given the server is running
    When I send POST /status
    Then the response status is 405

  Scenario: Response body contains no extra undocumented fields
    Given the server is running
    When I send GET /status
    Then the response body has exactly the fields: "time", "uptime", "version"
```

---

## Types & Data Structures

```typescript
// Response payload shape
interface StatusResponse {
  time: string;    // ISO 8601 UTC — e.g. "2026-03-29T12:00:00.000Z"
  uptime: number;  // Whole seconds since module cold-start (Math.floor)
  version: string; // Semver string from package.json — e.g. "1.0.0"
}
```

No changes to `AppContext` are required.

---

## Invariants & Constraints

1. **Version read once**: `VERSION` is a module-level constant populated from a static `import` of `package.json`. It is never re-read per request.
2. **Start time captured once**: `START_TIME = Date.now()` is evaluated when the module is first loaded (cold-start). Subsequent requests within the same isolate reuse this value.
3. **Uptime is whole seconds**: `Math.floor((Date.now() - START_TIME) / 1000)` — fractional seconds are truncated, not rounded.
4. **Time format is ISO 8601 UTC**: `new Date().toISOString()` always produces a `Z`-suffix string.
5. **Only GET is handled**: The route uses method-based routing (`{ get: handler }`). The rwsdk framework automatically returns 405 for unregistered methods on a matched path.
6. **Route registered before `render(...)`**: The `/status` route appears in `defineApp([...])` before the `render(Document, [...])` call so it is evaluated first and returns before any React rendering logic runs.
7. **No React dependency**: `src/app/status.ts` does not import React and has no JSX.

---

## Tasks

### Preparation
- [ ] Broaden `test` script in `package.json` from `src/lib/*.test.ts` to `src/**/*.test.ts`

### Implementation
- [ ] Create `src/app/status.ts`:
  - Module-level `START_TIME = Date.now()`
  - Static import of `package.json` to extract `version` into `VERSION`
  - Export `statusHandler` as a method-handlers object `{ get: () => Response.json(payload) }`
- [ ] Modify `src/worker.tsx`:
  - Import `statusHandler` from `@/app/status`
  - Add `route("/status", statusHandler)` to `defineApp([...])` array, before the `render(...)` entry

### Tests
- [ ] Create `src/app/status.test.ts`:
  - Test that the handler returns HTTP 200
  - Test that `Content-Type` is `application/json`
  - Test that the response body is parseable JSON with `time`, `uptime`, `version` fields
  - Test that `time` is a valid ISO 8601 UTC string (ends with `Z`, parses to a Date)
  - Test that `uptime` is a non-negative integer
  - Test that `version` equals the value from `package.json`
  - Test that no extra fields are present in the response body

### Verification
- [ ] Run `pnpm test` — all tests pass
- [ ] Run `pnpm run types` — no TypeScript errors
- [ ] Smoke-test with `curl` against the local dev server

---

## Relevant Learnings & Decisions

**No `.docs/` artifacts exist yet** — this is the first entry. No existing blueprints were consulted.

**Uptime idiom in Cloudflare Workers**: `process` is not available. The only reliable approach is a module-level timestamp. This is consistent with how Workers documentation recommends measuring wall-clock elapsed time. The value resets on cold-start, which is semantically equivalent to "time since this server instance started".

**`Response.json()` vs manual JSON stringification**: The Workers runtime includes `Response.json(body, init?)` which sets `Content-Type: application/json` automatically. Using it is more concise and idiomatic than `new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } })`.

**Test file location**: Placing `status.test.ts` next to `status.ts` in `src/app/` follows co-location conventions. It requires the test glob to be updated — a small, clearly scoped change.

**Method-based routing for 405 handling**: Using `{ get: handler }` instead of a plain function handler lets rwsdk handle OPTIONS and non-GET methods automatically (405 response), with no custom logic needed in the handler.

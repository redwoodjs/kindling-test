# RFC: `/diag2` Endpoint Proposal B

**Date**: 2026-04-15
**Author**: DeveloperB
**Status**: Draft

---

## 2000ft View Narrative

`/diag2` should be a public, read-only diagnostic snapshot endpoint for callers that want the existing status and health facts in one round trip. It returns a single JSON object with the current runtime state, the existing `status` sentinel, a `healthy` flag, and the same uptime warning used by `/health` when the instance has been alive long enough. The route stays side-effect free, does not echo request data, and relies on the framework's standard 405 handling for non-GET methods.

Proposal B differs from the lean composition approach by introducing a small shared diagnostics builder. The builder captures the current clock sample once, derives time and uptime from that same sample, and centralizes the warning decision so `/status` and `/diag2` can stay aligned without duplicating runtime math. That gives us a reusable plumbing layer now, while keeping the public contract narrow and stable.

---

## Public Contract

`GET /diag2` returns `200 OK` with `application/json`.

The response body is a flat snapshot with these fields:

- `status`: always `"ok"`
- `healthy`: always `true`
- `requestId`: a fresh UUID per request
- `time`: the current server time in ISO 8601 UTC
- `uptime`: the current instance uptime in whole seconds
- `version`: the application version string
- `warning`: present only when uptime exceeds 24 hours, with the same literal text used by `/health`

This endpoint is additive. Existing `/status` and `/health` callers keep their current contracts, and `/diag2` becomes the one-stop endpoint for callers that want both operational and health information together.

---

## Implementation Breakdown

| Tag | File | Purpose |
|-----|------|---------|
| `[NEW]` | `src/app/diagnostics.ts` | Pure shared snapshot builder that captures runtime facts once and derives the health advisory from the same sample |
| `[MODIFY]` | `src/app/status.ts` | Reuse the shared runtime-facts helper so the current `/status` payload keeps its shape but no longer owns duplicate clock/uptime math |
| `[NEW]` | `src/app/diag2.ts` | `/diag2` route handler that assembles the combined snapshot and returns `Response.json(...)` |
| `[MODIFY]` | `src/worker.tsx` | Register `route("/diag2", { get: diag2Handler })` before the `render(...)` block |
| `[NEW]` | `src/app/diag2.test.ts` | Tests for the combined snapshot, warning boundary, and 405 behavior |

The shared builder should stay narrow: it may accept injectable clock and threshold inputs for tests, but it must not accept raw request state, headers, query strings, or environment data.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: GET /diag2

  Scenario: Returns the combined diagnostics snapshot
    Given the worker is running
    When I send GET /diag2
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response body contains "status": "ok"
    And the response body contains "healthy": true
    And the response body contains a fresh request identifier
    And the response body contains a current ISO 8601 UTC time
    And the response body contains a non-negative whole-number uptime
    And the response body contains the current version string

  Scenario: Adds the health warning only after 24 hours
    Given the current instance uptime is greater than 24 hours
    When I send GET /diag2
    Then the response body contains the warning "uptime exceeds 24h, consider recycling"

  Scenario: Exactly 24 hours does not warn
    Given the current instance uptime is exactly 24 hours
    When I send GET /diag2
    Then the response body does not contain a warning field

  Scenario: Non-GET methods are rejected
    Given the worker is running
    When I send POST /diag2
    Then the response status is 405

  Scenario: The endpoint does not echo request data
    Given the worker is running
    When I send GET /diag2 with arbitrary query or header values
    Then the response body contains none of those request values
```

---

## Types & Data Structures

```ts
type Diag2ResponseBase = {
  status: "ok";
  healthy: true;
  requestId: string;
  time: string;
  uptime: number;
  version: string;
};

type Diag2ResponseWithWarning = Diag2ResponseBase & {
  warning: "uptime exceeds 24h, consider recycling";
};

type Diag2Response = Diag2ResponseBase | Diag2ResponseWithWarning;
```

The shared builder can also expose smaller internal shapes, but the route-visible contract should stay flat and match the object above.

---

## Invariants & Constraints

1. **Read-only behavior**: The handler performs no writes, no logging side effects, and no state mutation.
2. **Public access**: No authentication or request-specific authorization is required.
3. **GET only**: Non-GET methods are left to rwsdk's built-in 405 handling for matched paths.
4. **Single clock sample**: `time`, `uptime`, and the warning decision come from the same sampled instant so the snapshot cannot drift within one response.
5. **No request echoing**: Query strings, headers, body content, and other inbound request data must not appear in the response body.
6. **No secrets or environment leakage**: The response must be composed only from the known diagnostics facts already exposed by the public surface.
7. **Warning semantics match `/health`**: The warning is advisory only; `healthy` remains `true` even when the warning is present.
8. **Route placement**: The `/diag2` route must be registered before `render(Document, [...])` in `src/worker.tsx`.
9. **JSON response path**: Use `Response.json(...)` so the runtime sets the content type consistently.

---

## Risks

- A shared diagnostics builder can become a dumping ground if it is allowed to accept arbitrary request or environment data. Keep it narrowly focused on runtime facts only.
- Refactoring `/status` to share the builder could accidentally widen its payload if the shared shape is not explicit. The shared helper should return the common runtime fields, not the endpoint-specific wrapper.
- Multiple clock reads within one request could make `time` and `uptime` disagree at the margins. The builder should sample once and derive everything from that sample.
- Reusing health logic across endpoints may create the impression that `/diag2` is a failure signal. It is not; the endpoint remains informational, and warnings are advisory only.

---

## Test Implications

- Add tests for the combined response shape, including the `status` and `healthy` sentinels.
- Assert that `warning` appears only when uptime is strictly greater than 24 hours.
- Assert that exactly 24 hours does not trigger the warning.
- Assert that `GET /diag2` returns `405` for unsupported verbs through the framework's default method handling.
- Keep existing `/status` and `/health` tests intact so the shared builder does not change their public contracts.
- No test script change is needed; the current test glob already covers co-located tests under `src/`.

---

## Proposed Tasks

- [ ] Add a shared diagnostics snapshot builder that captures the common runtime facts once per request
- [ ] Keep `/status` on the existing public contract while routing its runtime facts through the shared helper
- [ ] Add `/diag2` as a top-level Worker route before the SSR render path
- [ ] Add tests for the new combined snapshot and the warning boundary
- [ ] Verify that the existing diagnostics endpoints still pass their current tests unchanged

---

## Relevant Learnings & Decisions

- `/status`, `/health`, and `/ping` already live outside the React render tree, so `/diag2` should follow the same routing pattern.
- The existing uptime convention in this repo is a module-load timestamp plus a per-request subtraction, which is the right source of truth for Worker instance age.
- `Response.json()` is the preferred response path for these endpoints and keeps the content type correct without manual header work.
- rwsdk's method dispatch already gives the correct 405 behavior for matched paths when only `get` is registered.
- The current test runner already discovers `src/**/*.test.ts`, so the new tests can sit beside the implementation without any test-config update.


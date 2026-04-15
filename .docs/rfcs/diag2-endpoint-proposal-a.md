# RFC: Add `/diag2` Endpoint (Proposal A)

**Date**: 2026-04-15  
**Author**: DeveloperA  
**Status**: Draft

---

## 2000ft View

`/diag2` is a public, GET-only diagnostic snapshot that combines the stable facts already exposed by the existing status and health surfaces into one response. It is intended for operators and monitors that want a single request to answer the two core questions at once: is the instance alive, and what is its current runtime state?

The lean implementation path is to add one dedicated route handler that computes the snapshot directly from the same runtime facts already used elsewhere, rather than introducing a new shared diagnostics framework. That keeps the change small and local while preserving the current `/status`, `/health`, and `/ping` contracts unchanged.

## Public Contract

- `GET /diag2`
- Returns `200 OK` with JSON.
- Response body is a combined snapshot with the following fields:
  - `status: "ok"`
  - `healthy: true`
  - `requestId: string`
  - `time: string`
  - `uptime: number`
  - `version: string`
  - `warning?: "uptime exceeds 24h, consider recycling"`
- `requestId` is freshly generated per request and is safe for correlation.
- `time` is a server-side ISO 8601 UTC timestamp.
- `uptime` is the current Worker instance uptime in whole seconds, matching the semantics already used by `/status`.
- `warning` is present only when uptime is strictly greater than 24 hours, matching the existing health threshold.
- No request body, headers, query string, or secrets are echoed back.
- No authentication or persistence is involved.
- Non-GET methods are rejected by the framework with `405 Method Not Allowed`.

## Caller Experience

`/diag2` is the one-stop operational snapshot for callers that currently have to fan out to multiple probes. The response is intentionally compact but still contains enough information to correlate a request, confirm the instance is healthy, and identify stale runtime instances that should be recycled.

The endpoint does not replace the lighter probes. `/health` stays the smallest liveness check, `/ping` stays the smallest timestamp probe, and `/status` stays the structured runtime summary. `/diag2` is the combined view for operators who want both status and health in one round trip.

## Behavior Spec

```gherkin
Feature: GET /diag2

  Scenario: Returns the combined diagnostic snapshot
    Given the server is running
    When a GET request is sent to /diag2
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the body contains status "ok"
    And the body contains healthy true
    And the body contains requestId, time, uptime, and version fields
    And the body does not echo request data

  Scenario: Uptime warning follows the existing health threshold
    Given the server has been running for more than 24 hours
    When a GET request is sent to /diag2
    Then the response body includes warning "uptime exceeds 24h, consider recycling"

  Scenario: Exactly 24 hours does not warn
    Given the server has been running for exactly 24 hours
    When a GET request is sent to /diag2
    Then the response body does not include warning

  Scenario: Non-GET methods are rejected
    Given the server is running
    When a POST request is sent to /diag2
    Then the response status is 405
```

## Invariants & Constraints

1. **Read-only boundary**: The handler must not mutate state, write storage, emit side effects, or depend on anything that can change the system outside the request scope.
2. **No echoing**: The response must not reflect request headers, body content, query parameters, cookies, or any other caller-supplied payload.
3. **No secrets exposure**: The endpoint must not surface environment variables, tokens, internal configuration, or other sensitive runtime details.
4. **Status parity**: The `status`, `requestId`, `time`, `uptime`, and `version` fields should match the semantics already established by `/status`.
5. **Health parity**: The `healthy` field must remain `true`, and the warning boundary must stay strictly greater than 24 hours, matching `/health`.
6. **Method handling**: The route should use the framework’s method handler shape so `405` behavior remains automatic.
7. **Route placement**: The route must be registered in the worker route layer before SSR rendering so it bypasses the React pipeline.
8. **No deprecation**: Existing diagnostic endpoints remain valid and unchanged.

## Implementation Shape

The smallest safe change is a single new handler module plus one route registration in the worker entrypoint. The handler should build the combined JSON payload directly from the existing runtime facts instead of calling other endpoints or introducing a shared diagnostics abstraction.

Proposed files:

- `src/app/diag2.ts` or equivalent server-side handler module
- `src/worker.tsx` route registration for `GET /diag2`
- `src/app/diag2.test.ts` for unit coverage of the new snapshot shape

The handler can follow the same pattern as the current JSON endpoints: capture the current time, derive uptime from the module-load start time, generate a fresh request identifier, compute the warning from the health threshold, and return `Response.json(...)`.

## Risks

- **Duplication drift**: Because this proposal keeps the implementation direct and lean, it intentionally duplicates some diagnostic logic. If the status or health semantics change later, `/diag2` must be updated in lockstep.
- **Snapshot ambiguity**: Combining status and health fields in one payload adds a new public shape. The field set must stay stable once published so operators can rely on it.
- **Boundary regressions**: The 24-hour warning threshold must remain exact. A mistaken `>=` comparison would change the caller-visible behavior at the boundary.

## Test Implications

Tests should treat `/diag2` as a black-box API surface and verify the published contract rather than implementation details. At minimum, they should cover:

- `GET` returns `200` with JSON content-type.
- The payload includes the combined status and health fields.
- The warning appears only when uptime is strictly greater than 24 hours.
- Exactly 24 hours does not trigger the warning.
- Non-GET methods return `405`.
- No request-derived data is reflected in the response.
- The snapshot remains side-effect free and deterministic enough to assert structure, while still generating per-request values for time and correlation.

## Non-Goals

- Introducing a shared diagnostics framework.
- Replacing `/status`, `/health`, or `/ping`.
- Adding authentication or authorization.
- Exposing request metadata or secrets.


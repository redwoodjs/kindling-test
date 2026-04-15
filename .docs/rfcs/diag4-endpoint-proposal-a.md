# RFC Proposal A: Add `/diag4` Endpoint

**Date**: 2026-04-15
**Status**: Proposal A

---

## 2000ft View

`/diag4` should be a public, GET-only diagnostic snapshot for operators and synthetic monitors. The smallest viable version is a direct worker route that returns compact JSON with a stable schema marker, a success flag, a request correlation id, UTC time, instance uptime, build version, and a small local checks object. It should bypass SSR, avoid side effects, and explicitly opt out of caching so the response reflects the current isolate rather than a stale intermediary copy.

This proposal intentionally reuses the same route and time-measurement patterns already used by the existing operational endpoints. That keeps the change narrow and avoids introducing a new subsystem just for diagnostics.

## Proposed Contract

- `GET /diag4` returns `200 OK` and `application/json`.
- The body includes `schema`, `ok`, `requestId`, `time`, `uptimeMs`, `version`, and `checks`.
- `schema` is a stable version marker such as `diag4/v1`.
- `ok` is always `true` on the success path.
- `requestId` is generated per request so logs and probes can be correlated.
- `time` is an ISO 8601 UTC string generated at response time.
- `uptimeMs` is the current Worker instance age in milliseconds.
- `version` comes from the same package metadata source used by the other status route.
- `checks` contains only local, non-sensitive assertions; no network calls or request echoing.
- Non-GET methods rely on the framework's built-in `405` handling.
- The response should carry `Cache-Control: no-store` to avoid stale diagnostic reads.

## Minimal Implementation Shape

- Register one top-level route before the SSR render step.
- Implement the handler as a plain JSON responder, not a React component.
- Reuse the existing module-start uptime pattern instead of `process.uptime()`.
- Keep the response body compact and deterministic.
- Do not add new middleware, environment flags, or background work.

## Assumptions

- The existing global header middleware stays in place and continues to apply security headers.
- A diagnostic endpoint does not need authentication in this environment.
- A small local checks object is enough; it does not need to report dependency health or call out to other services.
- The failure mode should be closed, not partial: if a required value cannot be produced, return a minimal error response rather than an incomplete diagnostic body.

## Integration Points

- Worker route registration needs the new path added ahead of SSR.
- The shared uptime approach can mirror the existing operational endpoints.
- The version value should continue to come from package metadata, not an environment variable.
- The current test setup can exercise the handler directly without a live Worker instance.

## Risks

- If the route is placed after SSR, it will be handled like a page and lose the fast diagnostic path.
- If caching is not disabled, probes can read stale data and hide a recent failure.
- If the checks object grows beyond local state, the endpoint can become sensitive or flaky.
- If the handler tries to be too clever, the endpoint stops being a cheap operational probe.

## Behavior Spec

```gherkin
Feature: /diag4 endpoint

  Scenario: GET /diag4 returns a diagnostic snapshot
    Given the Worker is running
    When I send GET /diag4
    Then the response status is 200
    And the response body is JSON
    And the body contains a stable schema marker
    And the body contains a success flag that is true
    And the body contains a request correlation id
    And the body contains a UTC timestamp
    And the body contains an uptime value in milliseconds
    And the body contains a build version
    And the body contains a small local checks object
    And the response is not cacheable

  Scenario: Non-GET methods are rejected
    Given the Worker is running
    When I send POST /diag4
    Then the response status is 405

  Scenario: The response stays non-sensitive
    Given the Worker is running
    When I send GET /diag4
    Then the body does not echo request headers, secrets, or external dependency results
```

## Why This Proposal

This version is the smallest route change that still satisfies the contract. It reuses the existing Worker-level routing model, keeps the payload intentionally narrow, and leaves room for the arbitration step to tighten the exact checks object if needed.

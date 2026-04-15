# RFC Proposal B: Add `/diag4`

**Date:** 2026-04-15  
**Author:** DeveloperB  
**Status:** Proposal

---

## 2000ft View

`/diag4` should be a public, GET-only diagnostic snapshot for operators and synthetic monitors. This proposal takes a defensive posture: the response is intentionally non-cacheable, includes a request correlation id in both the body and headers, and is registered at the top level of the Worker so it cannot be captured by the SSR page pipeline.

The payload should stay compact and machine-readable: a schema marker, success flag, request id, UTC timestamp, isolate uptime in milliseconds, build version, and the route name. It should not echo request data, touch external services, or depend on mutable state outside the isolate.

The tradeoff is a slightly larger response and a little more response-header plumbing, but the result is safer for incident response and less likely to be corrupted by caches or routing changes.

---

## Contract

- GET `/diag4` returns HTTP 200 and JSON.
- Non-GET methods rely on rwsdk's automatic 405 handling.
- Response headers must disable caching explicitly. At minimum use `Cache-Control: no-store, max-age=0, must-revalidate`; add `Pragma: no-cache` and `Expires: 0` for conservative intermediaries.
- The response body shape is stable:
  - `schema`: `"diag4.v1"`
  - `ok`: `true`
  - `requestId`: request-scoped UUID
  - `time`: UTC ISO 8601 timestamp
  - `uptimeMs`: non-negative integer milliseconds since module load
  - `version`: application version string
  - `route`: `"/diag4"`
- The same request id should also be exposed as an `X-Request-Id` response header for easier log joining.
- The handler must not read the request body, echo headers, or perform network calls.

---

## Why This Shape

- Operational value: a monitor can tell whether the Worker was reached, what build is running, and how long the isolate has been alive without extra parsing.
- Cache safety: no-store headers on the response itself prevent stale diagnostics from being served by browsers, intermediaries, or accidental edge caching.
- Routing safety: putting the route in the top-level Worker route list, before the SSR render block, ensures it bypasses page rendering and stays stable if page routing grows later.
- Observability: a UUID in both the body and a header gives a stable join key for logs, traces, and synthetic checks.

---

## Integration Points

- Register the route in the Worker's top-level route list, not inside page rendering.
- Reuse the existing pattern of a plain JSON response handler rather than a React component.
- Keep common security headers in the shared middleware; apply cache control at the route level because it is path-specific.
- Use module initialization time for uptime so the value tracks the isolate rather than wall-clock process state.
- Keep the schema versioned so later fields can be added without ambiguity.

---

## Risks and Tradeoffs

- More headers mean slightly more implementation surface, but the cache protection is worth it for a diagnostic endpoint.
- Exposing `requestId` and `version` is intentional; it improves supportability but should remain limited to non-sensitive local metadata.
- A millisecond uptime is more precise than the existing status route, but it is still only an isolate-age approximation, not a host-level uptime measurement.
- If a future routing refactor introduces a catch-all before the API list, the endpoint could be shadowed; keeping it at the top level reduces that risk.

---

## Behavior Spec

```gherkin
Feature: GET /diag4

  Scenario: Successful diagnostic read
    Given the server is running
    When a GET request is made to /diag4
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response headers include "Cache-Control" with no-store semantics
    And the response headers include "X-Request-Id"
    And the body contains the fields schema, ok, requestId, time, uptimeMs, version, and route

  Scenario: The route is non-cacheable
    Given the server is running
    When a GET request is made to /diag4 twice through the same client
    Then each response is generated fresh rather than served from a cached copy
    And the requestId values are distinct

  Scenario: Non-GET methods are rejected
    Given the server is running
    When a POST request is made to /diag4
    Then the response status is 405
```

---

## Types & Data Structures

```ts
interface Diag4Response {
  schema: "diag4.v1";
  ok: true;
  requestId: string;
  time: string;
  uptimeMs: number;
  version: string;
  route: "/diag4";
}
```

---

## Open Questions

- Whether the later implementation should mirror the request id into logs as well as the response header.
- Whether the response should also include `CDN-Cache-Control: no-store` for extra defense on shared intermediaries.
- Whether the project wants the diagnostic route to live in its own module alongside the existing operational probes or share the status route module family.

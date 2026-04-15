# RFC Proposal A: Add `/diag5` Endpoint

**Date**: 2026-04-15  
**Author**: DeveloperA  
**Status**: Draft

---

## 2000ft View

This proposal adds `/diag5` as a public, read-only probe that confirms the Worker is reachable, current, and serving the expected build without exposing a debug dump. The endpoint returns a compact JSON payload with a fixed `status` sentinel, the route name, a fresh request identifier, wall-clock time, instance uptime, and the application version. It is intentionally narrow enough for monitors and release automation, but not broad enough to leak request content, environment metadata, or operational secrets.

The implementation should stay close to the existing route pattern already used by the other machine-oriented endpoints: register the route in the Worker before the SSR render pipeline, return JSON directly from a plain handler, and keep the cache policy local to the route rather than widening shared middleware behavior.

---

## Proposed Contract

### Request

- `GET /diag5`
- No authentication
- No request body
- No query-driven behavior
- No header reflection or request echoing

### Response

```json
{
  "status": "ok",
  "endpoint": "diag5",
  "requestId": "<fresh uuid>",
  "time": "<ISO-8601 UTC>",
  "uptime": 123,
  "version": "1.0.0"
}
```

- `status` is always `"ok"`
- `endpoint` is always `"diag5"`
- `requestId` is generated server-side per request
- `time` is the response timestamp in UTC ISO format
- `uptime` is whole seconds since module initialization
- `version` is read once from package metadata

### Headers

- `Content-Type: application/json`
- `Cache-Control: no-store`

`no-store` is required so intermediaries do not keep stale probe responses. This route should not rely on a global cache policy change, because the stricter behavior belongs to the probe itself.

---

## Implementation Breakdown

### `[NEW]` `src/app/diag5.ts`

Add a dedicated route module for the probe:

- Export a module-level start timestamp captured at load time
- Export the application version from package metadata
- Export a `diag5Handler` method-handlers object with a `get` entry only
- Build the response from live request-time values
- Attach `Cache-Control: no-store` on the returned response

This design keeps the probe self-contained and avoids introducing a broader diagnostics abstraction before there is more than one diagnostic endpoint that needs to share behavior.

### `[MODIFY]` `src/worker.tsx`

Register `route("/diag5", diag5Handler)` in the top-level `defineApp([...])` array, before `render(Document, [...])`.

That placement ensures `/diag5` is handled at the routing layer and never falls through to the React rendering pipeline.

### `[MODIFY]` `.docs/blueprints/api-routes.md`

Add `/diag5` to the route inventory after the implementation lands, documenting it as a public probe with no-store semantics and the fixed response shape.

The blueprint should stay descriptive, not prescriptive: it should list the route and its observable behavior, but not repeat implementation mechanics or test seams.

---

## Behavior Spec

```gherkin
Feature: /diag5 probe

  Scenario: GET returns a machine-readable probe payload
    Given the Worker is running
    When a GET request is sent to /diag5
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the Cache-Control header contains "no-store"
    And the response body contains exactly the fields "status", "endpoint", "requestId", "time", "uptime", and "version"
    And the body field "status" equals "ok"
    And the body field "endpoint" equals "diag5"

  Scenario: Non-GET methods are rejected
    Given the Worker is running
    When a POST request is sent to /diag5
    Then the response status is 405
```

---

## Invariants & Boundaries

1. **Public by design**: the route is callable without credentials in every environment where the Worker is deployed.
2. **Read-only**: the handler must not mutate state, persist anything, or trigger side effects.
3. **Route ordering matters**: `/diag5` must be registered before the SSR `render(...)` block so it bypasses page rendering.
4. **Method restriction**: only `GET` is registered; unsupported methods should be left to the framework's built-in `405` handling.
5. **Instance uptime**: uptime must come from module initialization time, not from any process API, so the probe remains Cloudflare-compatible.
6. **Stable identity fields**: `status` and `endpoint` are fixed literals and must not vary by request or environment.
7. **No ambient reflection**: the response must not echo headers, cookies, query parameters, hostnames, deployment IDs, trace metadata, or environment names.
8. **No hidden data leakage**: the endpoint must never expose secrets, stack traces, build internals, or any other debug-only information.
9. **No cache storage**: caching policy stays local to the route and must not be pushed into the shared security headers middleware.

---

## Failure Handling

- Unsupported methods are handled by the framework as `405 Method Not Allowed`.
- There is no client validation surface, so there should be no bespoke `4xx` branch for request data.
- Unexpected runtime failures should surface as ordinary `500` errors rather than being converted into a partial or degraded probe response.
- The handler should fail closed. If anything unexpected breaks while assembling the payload, the request should not be treated as healthy.

This keeps the probe honest for monitors: either it returns the full contract or it fails visibly.

---

## Trade-offs

This proposal keeps the implementation small and direct. The main advantage is that the cache policy and exposure boundaries remain local to the probe, which makes the route easier to reason about and safer to review.

The trade-off is that it repeats the same general route pattern already used by the other operational endpoints. That duplication is acceptable here because the endpoint is intentionally narrow and there is no strong case yet for a shared diagnostics framework.

---

## Docs Impact

If this proposal is accepted, the route inventory should be updated to include `/diag5` with its public probe status, JSON shape, and no-store requirement. No broader user-facing documentation is needed unless the team later decides to present probe routes in a general handbook or operations guide.

The endpoint should be documented as a monitor-facing surface, not a support shell. If a richer debug route is ever needed, it should be introduced separately with different access controls and different documentation.


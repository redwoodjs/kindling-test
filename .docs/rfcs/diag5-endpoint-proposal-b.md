# RFC: `/diag5` Endpoint Proposal B

**Date**: 2026-04-15
**Author**: DeveloperB
**Status**: Draft

---

## 2000ft View Narrative

The `/diag5` endpoint should be a public, read-only operational probe that confirms the worker is alive, correctly routed, and serving the current build without exposing anything sensitive. Its response is fixed and machine-readable: a success sentinel, the endpoint name, a fresh request correlation ID, the current UTC time, the instance uptime in whole seconds, and the application version.

This proposal uses a registry-oriented implementation shape instead of a one-off route module. The endpoint payload stays pure and testable, while the worker mounts a small bundle of public diagnostics routes before the SSR render step so operational wiring stays visible in one place as the route set grows.

The response must be explicitly uncacheable. On success, the endpoint itself owns the cache policy by returning JSON with `Cache-Control: no-store`, rather than depending on a broader middleware change or on client behavior.

---

## Implementation Breakdown

| Tag | File | Purpose |
|-----|------|---------|
| `[NEW]` | `src/app/diag5.ts` | Pure payload builder and request handler factory for the `/diag5` probe |
| `[NEW]` | `src/app/diagnostics.ts` | Registry for public operational routes so probes can be mounted together |
| `[MODIFY]` | `src/worker.tsx` | Import the diagnostics registry and register `/diag5` before `render(...)` |
| `[MODIFY]` | `.docs/blueprints/api-routes.md` | Add `/diag5` to the live route index after the endpoint is accepted |

The route module itself should remain small. Its job is to collect the request-time facts, shape the response body, and attach the no-store header in one place. The registry file is intentionally boring: it exists to keep the worker-level mount order explicit and to avoid scattering public probe registration across unrelated modules.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: GET /diag5

  Scenario: Returns the operational probe payload
    Given the worker is running
    When I send GET /diag5
    Then the response status is 200
    And the response body is valid JSON
    And the body contains exactly the fields "status", "endpoint", "requestId", "time", "uptime", and "version"
    And the field "status" equals "ok"
    And the field "endpoint" equals "diag5"
    And the field "requestId" is a fresh UUID v4 string
    And the field "time" is a UTC ISO-8601 timestamp
    And the field "uptime" is a non-negative whole number
    And the field "version" is a non-empty string

  Scenario: Response is not cacheable
    Given the worker is running
    When I send GET /diag5
    Then the response includes Cache-Control with no-store semantics

  Scenario: Non-GET methods are rejected
    Given the worker is running
    When I send POST /diag5
    Then the response status is 405

  Scenario: The endpoint is public and does not reflect request data
    Given the worker is running
    When I send GET /diag5 with arbitrary headers, cookies, or query parameters
    Then the response still has the same fixed field set
    And the response does not echo request headers, cookies, body, or query values
```

---

## Types & Data Structures

```typescript
type Diag5Response = {
  status: "ok";
  endpoint: "diag5";
  requestId: string;
  time: string;
  uptime: number;
  version: string;
};

type Diag5Dependencies = {
  now: () => number;
  randomUUID: () => string;
  version: string;
  startTime: number;
};
```

`Diag5Dependencies` is a proposed seam for testability and orchestration. It keeps the runtime sources of truth explicit, which makes the handler easy to drive in tests without mutating globals or waiting for real time to pass.

---

## Invariants & Constraints

1. **GET only**: The route is registered with method-based routing so unsupported verbs continue to receive the framework's default `405 Method Not Allowed` response.
2. **Public accessibility**: No authentication, authorization, or tenant gating. The endpoint is intentionally reachable by monitors and humans alike.
3. **No request reflection**: Headers, cookies, query parameters, request bodies, and other caller-supplied data must not be echoed back in the response.
4. **No sensitive disclosure**: The payload must not expose environment names, hostnames, deployment IDs, stack traces, secrets, internal URLs, or backend inventory.
5. **Fresh correlation ID**: `requestId` is generated per request and must not be reused across calls.
6. **Stable time source**: `time` comes from the request moment and is serialized as UTC ISO-8601 text.
7. **Worker uptime semantics**: `uptime` is measured from module initialization time, not process uptime, and is expressed in whole seconds.
8. **Version loaded once**: `version` is read from package metadata at module load time and reused across requests.
9. **No-store on success**: The success response sets `Cache-Control: no-store` so probes are never replayed from intermediary caches.
10. **Route order**: The diagnostics registry must be mounted before the SSR render pipeline so the probe bypasses page rendering entirely.

---

## Failure Handling

This endpoint has no client input to validate, so normal rejection paths are limited to method mismatch. Any unexpected runtime fault should surface as the worker's standard 500 behavior instead of being converted into a synthetic diagnostic JSON body.

That choice is deliberate. A partial or fallback probe response would be more misleading than an explicit failure, and it could hide the very routing or runtime problem the probe is meant to reveal.

---

## Documentation Impact

The route index should list `/diag5` as a public operational probe once the implementation is accepted, and the blueprint should describe it as non-sensitive and uncacheable. No deeper user-facing documentation is needed because the payload is intentionally narrow and self-describing.

If a richer diagnostics surface is ever needed later, it should be documented separately and kept distinct from this public probe so the contract here remains small and safe.

---

## Tasks

- [ ] Add the probe payload builder and handler factory.
- [ ] Add the diagnostics route registry and mount it before the SSR render step.
- [ ] Register `/diag5` with GET-only semantics.
- [ ] Ensure the response is returned with no-store cache semantics.
- [ ] Update the live API route index after implementation is in place.

---

## Relevant Learnings & Decisions

- The worker already uses a top-level route registration pattern for JSON endpoints, so the new probe should follow the same request lifecycle and remain outside page rendering.
- Cloudflare Workers uptime should be measured from module initialization time, not from any process API.
- Public probe endpoints must stay sparse by design; exposing extra request metadata creates fingerprinting risk without improving operational value.
- A registry-based mount point keeps probe routes easy to audit and makes later additions less likely to fragment the worker file.

# RFC: Add `/pulse` Endpoint

**Date**: 2026-04-15  
**Author**: DeveloperA  
**Status**: Draft

---

## 2000ft View

Add a minimal `/pulse` JSON endpoint that returns the exact heartbeat payload `{"beat":"steady"}` with HTTP 200. The route is public, has no side effects, and exists only as a simple machine-readable liveness signal. It must be registered as a top-level Worker route before the React render pipeline so it bypasses SSR and returns directly from the routing layer.

The QA contract is intentionally narrow: GET must succeed with JSON, POST must be rejected with 405, and the response body must match exactly with no extra fields. This implementation should stay small enough that the route behavior is obvious from inspection and easy to keep stable.

---

## Implementation Breakdown

| Tag | File | Purpose |
|-----|------|---------|
| `[NEW]` | `src/lib/pulse.ts` | Export `pulseHandler`, a pure method handler that returns `Response.json({ beat: "steady" })` |
| `[MODIFY]` | `src/worker.tsx` | Import `pulseHandler` and add `route("/pulse", { get: pulseHandler })` before `render(...)` |

The existing request-driven test file in `src/lib/pulse.test.ts` already encodes the acceptance contract. No test harness changes are expected unless the route registration shape changes during review.

---

## Behavior Spec

```gherkin
Feature: /pulse endpoint

  Scenario: GET /pulse returns the heartbeat payload
    Given the server is running
    When a GET request is sent to /pulse
    Then the response status is 200
    And the Content-Type header includes "application/json"
    And the response body is exactly {"beat":"steady"}

  Scenario: POST /pulse is not supported
    Given the server is running
    When a POST request is sent to /pulse
    Then the response status is 405
```

---

## Types & Data Structures

```ts
type PulseResponse = {
  beat: "steady";
};
```

No additional fields are required. The handler should not add timestamps, request IDs, warnings, or version metadata.

---

## Invariants & Constraints

1. The endpoint is public and unauthenticated.
2. The handler is deterministic and has no side effects.
3. The body must remain exact: one field, one literal value, no extras.
4. `Response.json()` should be used so the JSON content type is set automatically.
5. The route must be registered before `render(Document, [...])` in `src/worker.tsx`.
6. The route should use method-based routing with only `get` defined so non-GET methods fall through to the framework's automatic 405 handling.
7. The implementation should not depend on request-specific context, clocks, or environment state.

---

## Main Risks

- Reusing the status or health patterns would add metadata that breaks the exact-body contract.
- Registering the route after the render pipeline could cause the request to enter SSR instead of returning the JSON response directly.
- A manual `Response` construction could miss the JSON content type or accidentally drift from the exact payload.
- Adding more than a GET handler would blur the 405 contract that the QA test already anchors.

---

## Tasks

- [ ] Add `src/lib/pulse.ts` with a minimal `pulseHandler` export.
- [ ] Register `/pulse` in `src/worker.tsx` before the render pipeline.
- [ ] Keep the request-driven test as the contract check for GET 200, exact body, and POST 405.
- [ ] Verify the endpoint stays isolated from the existing `/status`, `/health`, and `/ping` routes.

---

## Relevant Learnings & Decisions

- Machine-readable routes in this repo live outside SSR and are registered at the top level of `defineApp([...])` before `render(...)`.
- The framework's method-handler routing provides the 405 behavior automatically when only `get` is supplied.
- `Response.json()` is the simplest way to satisfy the JSON header contract without adding manual header code.
- The pulse route is intentionally simpler than `/ping` and `/health`: it does not need a timestamp, uptime calculation, or warning branch.

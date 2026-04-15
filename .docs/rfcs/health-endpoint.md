# RFC: Add `/health` Endpoint

**Date**: 2026-03-29
**Status**: Implemented

---

## 2000ft View

Add a public `/health` endpoint that returns the smallest possible liveness signal: `{"status":"ok"}`. The route is intended for load balancers, uptime monitors, and smoke tests that only need to know the Worker is responding. It has no authentication, no side effects, and no request-specific or time-based data.

The endpoint is registered in the Worker entrypoint before the React rendering pipeline so it bypasses SSR and responds directly with JSON.

## Implementation Breakdown

### `[MODIFY]` `src/app/pages/health.ts`

Export a simple handler that returns `Response.json({ status: "ok" })`.

### `[MODIFY]` `src/worker.tsx`

Register `/health` with the Worker routes before `render(Document, [...])` so the JSON response bypasses the React pipeline.

### `[MODIFY]` `src/lib/health.test.ts`

Assert that the handler returns HTTP 200, the JSON content type, and the exact body `{ "status": "ok" }`.

## Behavior Spec (Gherkin)

```gherkin
Feature: Health endpoint

  Scenario: GET /health returns liveness JSON
    Given the server is running
    When a GET request is made to /health
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response body is {"status":"ok"}

  Scenario: Non-GET method is rejected
    Given the server is running
    When a POST request is made to /health
    Then the response status is 405
```

## Types & Data Structures

```typescript
type HealthResponse = {
  status: "ok";
};
```

## Invariants & Constraints

1. The response body is always exactly `{ status: "ok" }`.
2. The route returns HTTP 200 on success.
3. The route is public and has no side effects.
4. The route is registered with GET-only handling, so other methods return 405.
5. The route is placed before the React render pipeline so it bypasses SSR.

## Tasks

- [x] Add the health response handler
- [x] Register the route in the Worker entrypoint
- [x] Add tests for response status, content type, and body shape
- [x] Update project knowledge to match the new response contract

## Relevant Learnings & Decisions

- Keep simple liveness endpoints static unless they need request-specific or time-based data.
- Register plain JSON routes before the rendering pipeline so they return directly.
- Use `Response.json(...)` for Worker JSON handlers so content type is set automatically.

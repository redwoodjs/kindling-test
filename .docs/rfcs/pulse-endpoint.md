# RFC: Add `/pulse` Endpoint

**Date:** 2026-04-15
**Author:** DeveloperB
**Status:** Draft

---

## 2000ft View

Add a minimal `/pulse` endpoint that returns HTTP 200 with the exact JSON payload `{"beat":"steady"}`. The response is intentionally static: no timestamps, no request IDs, no warning fields, and no side effects. It exists as a lightweight heartbeat for probes and smoke tests.

This proposal takes a route-owned implementation path. The real handler lives in the application layer alongside the other HTTP endpoints, and a thin compatibility re-export stays in `src/lib/` so the locked QA test can keep importing `./pulse.ts` without any harness changes.

---

## Implementation Breakdown

| Tag | File | Purpose |
|-----|------|---------|
| `[NEW]` | `src/app/pulse.ts` | Define the real `pulseHandler` and return `Response.json({ beat: "steady" })` |
| `[NEW]` | `src/lib/pulse.ts` | Re-export `pulseHandler` so the existing test import path stays valid |
| `[MODIFY]` | `src/worker.tsx` | Register `route("/pulse", { get: pulseHandler })` before `render(...)` |
| `[EXISTING]` | `src/lib/pulse.test.ts` | Black-box contract already written by QA; no changes required |

The app module is the single source of truth. The lib file should stay a pure forwarder so the route logic cannot drift between two implementations.

No test runner or glob changes are needed. The current test script already includes `src/**/*.test.ts`, and the QA file already lives inside that scope.

---

## Behavior Spec

```gherkin
Feature: GET /pulse

  Scenario: GET /pulse returns the heartbeat payload
    Given the server is running
    When a GET request is sent to /pulse
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response body is exactly {"beat":"steady"}

  Scenario: Non-GET methods are rejected
    Given the server is running
    When a POST request is sent to /pulse
    Then the response status is 405
```

---

## Types & Data Structures

```typescript
type PulseResponse = {
  beat: "steady";
};
```

No additional fields are part of the contract. The payload is static and does not carry timestamps, IDs, or warnings.

---

## Invariants & Constraints

1. The response body must be exactly `{"beat":"steady"}`.
2. The handler must be pure and deterministic.
3. `Response.json()` should be used so the runtime sets the JSON content type.
4. The route must be registered as GET only and placed before `render(...)` in the worker.
5. Non-GET methods should rely on rwsdk's default 405 behavior rather than custom branching.
6. The `src/lib/pulse.ts` file must remain a thin re-export, not a second implementation.

---

## Tradeoffs and Risks

- This adds one more file than the lib-only approach, but it keeps route ownership with the other application-level HTTP handlers.
- The compatibility re-export is a small indirection, so maintainers need to avoid editing both sides separately.
- Because the payload is fixed, any future need for metadata would require a contract change rather than a silent extension.
- The route should not introduce manual method checks; doing so would duplicate framework behavior and increase the chance of a 405 mismatch.

---

## Tasks

- [ ] Add the app-owned pulse handler
- [ ] Add the lib re-export used by the locked test import
- [ ] Register the route in the worker before the SSR render block
- [ ] Keep the QA test suite unchanged

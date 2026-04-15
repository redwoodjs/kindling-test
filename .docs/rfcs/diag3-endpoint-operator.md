# RFC: Add `/diag3` Endpoint (Operator Snapshot)

**Date**: 2026-04-15
**Author**: Developer
**Status**: Draft

---

## 2000ft View Narrative

`/diag3` should be the canonical public diagnostics snapshot for operators. It combines the service-alive signal, health status, request correlation token, wall-clock timestamp, uptime, version, and the existing long-uptime warning into one response that is easy to inspect in a terminal and straightforward to consume from automation.

This proposal intentionally overlaps with the current diagnostics routes so callers can migrate toward one richer entry point without losing the narrower endpoints that already exist. The tradeoff is a larger payload in exchange for fewer round trips and less ambiguity when an incident is in progress.

The endpoint stays public, GET-only, and JSON-based. It should not expose secrets, headers, environment values, or any partial internal state, and it should rely on the router's default 405 behavior for unsupported methods.

---

## Implementation Breakdown

| Tag | Scope | Purpose |
|-----|-------|---------|
| `[NEW]` | `/diag3` route contract | Define a canonical operator snapshot with operational metadata |
| `[MODIFY]` | Worker route registration | Register the route before SSR so it bypasses the React rendering path |
| `[NEW]` | Tests | Cover the response schema, boundary behavior, and unsupported methods |
| `[KEEP]` | Existing diagnostics routes | Leave `/status`, `/health`, and `/ping` available during adoption |

---

## Behavior Spec (Gherkin)

```gherkin
Feature: GET /diag3

  Scenario: Returns the canonical diagnostics snapshot
    Given the service is running
    When I send GET /diag3
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the body field "status" equals "ok"
    And the body field "healthy" equals true
    And the body field "requestId" is a unique identifier
    And the body field "time" is an ISO 8601 UTC timestamp
    And the body field "uptime" is a non-negative whole number
    And the body field "version" is a non-empty string

  Scenario: Includes a recycling warning once uptime is high
    Given the service has been running for more than 24 hours
    When I send GET /diag3
    Then the response status is 200
    And the body includes a warning recommending recycling

  Scenario: Does not warn at the boundary
    Given the service has been running for exactly 24 hours
    When I send GET /diag3
    Then the response status is 200
    And the body does not include a warning field

  Scenario: Rejects unsupported methods
    Given the service is running
    When I send POST /diag3
    Then the response status is 405
```

---

## Types & Data Structures

```typescript
type Diag3Response =
  | {
      status: "ok";
      healthy: true;
      requestId: string;
      time: string;
      uptime: number;
      version: string;
    }
  | {
      status: "ok";
      healthy: true;
      requestId: string;
      time: string;
      uptime: number;
      version: string;
      warning: "uptime exceeds 24h, consider recycling";
    };
```

`requestId` is a per-response correlation token, `time` is the server wall clock in UTC, `uptime` is a whole number of seconds, and `version` comes from the running build. The warning remains optional and is only present when the instance has crossed the uptime threshold.

---

## Invariants & Constraints

1. **Public access**: No authentication or session state is required.
2. **GET only**: The route is read-only and uses the router's default 405 handling for other methods.
3. **JSON only**: The payload is emitted as JSON so both humans and machines can read it consistently.
4. **Stable schema**: The field set is fixed apart from the optional warning, which only appears after the threshold is exceeded.
5. **Operational only**: The response must not include secrets, request headers, environment values, stack traces, or user data.
6. **Single source of truth**: The route should expose the same uptime threshold and warning wording already used by the current diagnostics surface.
7. **No partial state**: If the full snapshot cannot be produced, the response should fail generically rather than return a half-populated payload.

---

## Tasks

- [ ] Approve the operator snapshot as the canonical `/diag3` contract
- [ ] Implement the route as a GET-only JSON endpoint
- [ ] Register the route before SSR handling
- [ ] Add tests for the base snapshot, the warning boundary, and method rejection
- [ ] Document the route alongside the existing diagnostics surface after implementation

---

## Relevant Learnings & Decisions

The existing diagnostics routes already establish the style to follow: public, GET-only, JSON-based, and registered ahead of SSR. `/status` provides the correlation token, timestamp, uptime, and version metadata, while `/health` contributes the long-running warning pattern. This proposal merges those ideas into a single operator-facing surface so the new route answers most incident questions without requiring multiple requests.

The Worker uptime guidance and the testable time-dependent handler pattern both support this shape. They show that module-level start time tracking and an injected clock are the right foundation for a stable uptime signal, and the router's lowercase verb convention keeps the 405 behavior automatic.

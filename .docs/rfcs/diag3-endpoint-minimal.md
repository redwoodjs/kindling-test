# RFC: Add `/diag3` Endpoint (Minimal Contract)

**Date**: 2026-04-15
**Author**: Developer
**Status**: Draft

---

## 2000ft View Narrative

`/diag3` should be the smallest useful public diagnostics endpoint: a single machine-readable confirmation that the service is up and in a healthy state. The goal is to give monitors, smoke tests, and human operators one stable check that is easy to parse and hard to over-interpret.

This proposal deliberately keeps the payload narrow instead of turning the route into a full service snapshot. The existing diagnostics surface already provides richer detail through other routes, so `/diag3` should stay focused on a fast yes/no operational signal rather than duplicating the entire status inventory.

The contract stays public, GET-only, and JSON-based. Non-GET methods are rejected by the router's built-in method handling, and the response must not depend on authentication or any external system.

---

## Implementation Breakdown

| Tag | Scope | Purpose |
|-----|-------|---------|
| `[NEW]` | `/diag3` route contract | Define a compact JSON response with only the core operational indicators |
| `[MODIFY]` | Worker route registration | Register the route before SSR so it is handled as a plain HTTP endpoint |
| `[NEW]` | Tests | Cover the response shape, content type, and 405 behavior |

---

## Behavior Spec (Gherkin)

```gherkin
Feature: GET /diag3

  Scenario: Returns the minimal diagnostics payload
    Given the service is running
    When I send GET /diag3
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response body contains exactly the fields "status" and "healthy"
    And the body field "status" equals "ok"
    And the body field "healthy" equals true

  Scenario: Rejects unsupported methods
    Given the service is running
    When I send POST /diag3
    Then the response status is 405

  Scenario: Does not expose extra diagnostics data
    Given the service is running
    When I send GET /diag3
    Then the response body does not include request correlation data
    And the response body does not include uptime or version metadata
    And the response body does not include warning details
```

---

## Types & Data Structures

```typescript
type Diag3Response = {
  status: "ok";
  healthy: true;
};
```

The shape is intentionally fixed and small. There is no request identifier, timestamp, uptime, version string, or warning field in this variant.

---

## Invariants & Constraints

1. **Public access**: The endpoint is available without authentication and without session state.
2. **GET only**: The route accepts GET and relies on framework defaults for 405 handling on other methods.
3. **JSON only**: Successful responses must use the JSON response path so the content type is consistent.
4. **Stable shape**: The response contains exactly two fields and no optional extensions.
5. **No extra dependencies**: The route must not rely on databases, third-party services, or environment-specific configuration.
6. **No partial success**: If the route cannot produce the full payload, it should fail generically instead of returning a partial diagnostic blob.

---

## Tasks

- [ ] Finalize the minimal `/diag3` contract as a public health-and-status confirmation
- [ ] Implement the route as a GET-only JSON endpoint
- [ ] Register the route ahead of SSR handling
- [ ] Add tests for the contract, method restriction, and response shape
- [ ] Review whether existing diagnostic routes should remain as the richer alternative for callers that need more detail

---

## Relevant Learnings & Decisions

The current diagnostics surface already splits responsibilities across several public GET-only JSON routes. `/health` is intentionally tiny, `/status` carries more operational metadata, and `/ping` is a lightweight liveliness probe. That makes a minimal `/diag3` plausible as a stable confirmation route without forcing it to repeat all of the richer fields.

The route style should follow the existing worker routing pattern documented in the API route blueprint, with method verbs kept lowercase and the handler returned as plain JSON. Existing learnings about Worker uptime and time-dependent handlers are useful references, but this proposal intentionally avoids time-based branching so the contract stays as small as possible.

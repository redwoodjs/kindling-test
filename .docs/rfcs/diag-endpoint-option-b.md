# RFC: `/diag` Endpoint - Option B

**Date**: 2026-04-15
**Author**: DeveloperB
**Status**: Draft

---

## 2000ft View Narrative

`/diag` is the operator-facing diagnostic sibling to the existing liveness and status routes. This option keeps the response safe and machine-readable, but it places the trust boundary outside the application: only callers with a short-lived, verifiable operator assertion should be allowed through.

The main tradeoff in this draft is security posture versus deployment complexity. A signed, time-bound operator assertion is harder to misuse than a reusable bearer secret, and it reduces the blast radius if a credential leaks, but it also depends on a trusted signing flow and on clocks that are close enough to make expiry meaningful.

The endpoint itself remains intentionally narrow. It is GET-only, returns JSON, has no side effects, and exposes only an allowlisted snapshot of operational state. Anything sensitive, high-cardinality, or easy to misread stays out of the payload.

---

## Proposed Contract

### Access Model

- `/diag` is available only to operators who can present a short-lived signed assertion from trusted automation or an equivalent operator identity provider.
- The application must fail closed if the assertion is missing, expired, malformed, replayed, or otherwise unverifiable.
- Unauthorized callers should receive a generic not-found style response so the route is not easy to probe.
- This option is only appropriate where the deployment can reliably mint and verify those assertions; if that control plane does not exist, choose a simpler access model instead.

### Response Shape

A successful response should be a compact JSON snapshot with stable field names. The payload should include the current request correlation value, wall-clock time, uptime, build version, deployment identity, runtime identity, and a small set of allowlisted checks.

The payload should not include:

- raw environment variables
- request bodies
- cookies or authorization material
- stack traces
- configuration blobs
- free-form dependency dumps

Unknown or unavailable values should be omitted rather than replaced with placeholders that look authoritative.

### Diagnostics Strategy

This option treats `/diag` as a curated operator snapshot, not a debug dump. The response should report only coarse-grained state that answers the support questions "what am I hitting, is it fresh, and are the safety checks healthy enough to trust?"

If a check fails, the endpoint should surface that through a coarse status value and a bounded check summary rather than by emitting detailed failure text. The caller gets signal, not internals.

---

## Behavior Spec

```gherkin
Feature: GET /diag

  Scenario: Valid operator request returns a JSON diagnostic snapshot
    Given the request carries a valid short-lived operator assertion
    When I send GET /diag
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the body is valid JSON
    And the body contains a stable status value
    And the body contains a request correlation value
    And the body contains time, uptime, and version fields
    And the body contains a small allowlisted checks object

  Scenario: Invalid or missing operator assertion is rejected
    Given the request does not carry a valid operator assertion
    When I send GET /diag
    Then the response is indistinguishable from an unknown route

  Scenario: Non-GET methods are not allowed
    Given the request targets /diag
    When I send POST /diag
    Then the response status is 405

  Scenario: Sensitive material is never exposed
    Given the request carries a valid operator assertion
    When I send GET /diag
    Then the response body does not contain raw secrets, headers, stack traces, or unfiltered configuration
```

---

## Invariants & Constraints

1. **GET only**: the route is read-only and should not mutate state, emit commands, or trigger probes with side effects.
2. **JSON only**: the response is machine-readable JSON with a stable schema.
3. **Operator-only access**: access depends on a verifiable operator assertion, not on obscurity or public reachability.
4. **Fail closed**: if the assertion cannot be trusted, the endpoint must behave as if it is unavailable.
5. **Strict redaction**: only allowlisted fields may be returned.
6. **Coarse diagnostics**: the endpoint is for support and automation, not for dumping internals.
7. **Deployment dependency is explicit**: this option assumes a signing flow exists and is maintained alongside the deployment, not inside ad hoc request handling.

---

## Tradeoffs

### Why this option exists

This draft optimizes for a stronger operator boundary than a reusable shared secret. Time-bound assertions make replay less useful, support rotation more cleanly, and make leaked credentials less durable.

### Costs

- More deployment plumbing than a static secret
- Requires a reliable signing source and some clock discipline
- Less convenient for ad hoc manual use
- Harder to adopt in environments that do not already have operator identity or request signing

### Benefits

- Better containment if a credential leaks
- Cleaner separation between application logic and authentication policy
- More natural fit for environments that already have an identity or signing control plane

---

## Open Questions

1. What exact operator assertion model should the deployment standardize on?
2. Should local development bypass the assertion check, or should it use the same flow with a local signer?
3. Should the endpoint include a request correlation value in the response, or rely on external logging for traceability?
4. Should a failed check produce a degraded overall status, or should the route remain purely informational?
5. Which runtime facts are safe enough to expose beyond version, uptime, and a bounded check summary?
6. What is the exact unauthorized response shape: generic not found, or a separate denial that still avoids leakage?

---

## Suggested Payload Envelope

```ts
{
  status: "ok" | "degraded";
  schemaVersion: 1;
  requestId: string;
  time: string;
  uptime: number;
  version: string;
  deployment: {
    stage?: string;
  };
  runtime: {
    environment?: string;
    platform?: string;
  };
  checks: Record<string, boolean | "ok" | "warn" | "fail">;
}
```

The envelope is intentionally narrow. The important constraint is not the exact field list, but that every field is allowlisted, stable, and safe to expose to operators without leaking secrets or internal implementation detail.


# RFC: Add `/version` Endpoint

**Date**: 2026-04-15
**Status**: Implemented

---

## 2000ft View Narrative

Add a lightweight `/version` endpoint that returns a fixed JSON payload: `{"version":"1.0.0"}`. The endpoint is public, side-effect free, and intended for simple operational checks that need only the application version signal.

Implementation follows existing project conventions for API routes: register at the top level of the Worker router and before the React `render(...)` pipeline so requests are handled directly as JSON responses.

---

## Implementation Breakdown

**[NEW] `src/app/version.ts`**
Exports a minimal handler returning `Response.json({ version: "1.0.0" })`.

**[MODIFY] `src/worker.tsx`**
Registers `route("/version", { get: versionHandler })` before `render(...)`.

**[NEW] `src/app/version.test.ts`**
Adds black-box endpoint checks over live HTTP for response status/content-type, exact payload equality, unauthenticated access, unsupported-method behavior, and repeated-call consistency.

**[MODIFY] `.docs/blueprints/api-routes.md`**
Documents the new `GET /version` route and its response invariants.

---

## Behavior Spec

```gherkin
Feature: Version endpoint

  Scenario: GET /version returns fixed JSON payload
    Given the app is running
    When a GET request is sent to /version
    Then the response status is 200
    And the Content-Type header contains "application/json"
    And the response body equals {"version":"1.0.0"}

  Scenario: Endpoint is publicly accessible
    Given the app is running
    When a GET request is sent to /version without authentication
    Then the response status is 200
    And the response body equals {"version":"1.0.0"}

  Scenario: Unsupported methods are rejected
    Given the app is running
    When a POST request is sent to /version
    Then the response status is 405
```

---

## Types & Data Structures

```ts
type VersionResponse = {
  version: "1.0.0";
};
```

No additional shared types or context wiring are required.

---

## Invariants & Constraints

1. Route path is exactly `/version`.
2. Response payload contains exactly one top-level key: `version`.
3. Response value is exactly `"1.0.0"`.
4. Route uses lowercase method mapping (`get`) to align with rwsdk method handler semantics.
5. Route remains registered before `render(...)` so it bypasses SSR/RSC handling.
6. Endpoint has no authentication requirement and no side effects.

---

## Tasks

- [x] Add a dedicated version handler that returns the fixed JSON payload
- [x] Register `/version` in top-level Worker routing before `render(...)`
- [x] Add black-box contract tests for `/version`
- [x] Validate with project test and type-check commands
- [x] Update API route blueprint documentation

---

## Relevant Learnings & Decisions

1. **`.docs/learnings/rwsdk-route-method-verbs.md`**: Route method keys must be lowercase; this informed `get` usage and expected 405 behavior for unsupported methods.
2. **`.docs/blueprints/api-routes.md`**: API routes must be registered before `render(...)`; this guided route placement.
3. **`.docs/rfcs/ping-endpoint.md` and `.docs/rfcs/health-endpoint.md`**: Established precedent for small, side-effect free JSON endpoints.
4. **`src/app/version.test.ts` runtime validation**: Confirmed contract behavior through live HTTP checks, including repeated-call consistency and unsupported-method rejection.

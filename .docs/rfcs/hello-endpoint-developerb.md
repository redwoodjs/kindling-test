# RFC: Add `/hello` Endpoint (Alternate Draft)

**Date**: 2026-04-16
**Author**: DeveloperB
**Status**: Draft

---

## 2000ft View

Add a single public `GET /hello` endpoint that returns `200 OK` and a JSON greeting payload: `{"greeting":"hello world"}`. The public contract stays intentionally small and matches the ideator's recommendation, but this draft keeps the endpoint module in `src/app/` alongside the other route-facing modules so the server surface area is easier to audit in one place.

The route must be registered before the React render pipeline, and unsupported methods should rely on rwsdk's default `405 Method Not Allowed` behavior.

---

## Why This Variant

The main tradeoff in the repo is not the response shape; it is where route code should live. `src/lib/` is useful for general-purpose helpers, but a public HTTP endpoint is route-facing code, and the existing status and health modules already live under `src/app/`. Keeping `hello` there avoids creating a second home for routes and makes future endpoint discovery simpler.

This variant also keeps the test local to the endpoint module, which makes the change easy to reason about without pulling in a worker-level harness.

---

## Implementation Breakdown

### `[NEW]` `src/app/hello.ts`

Export `helloHandler` as a method-handler object with a lowercase `get` key.

Return `Response.json({ greeting: "hello world" })`.

Keep the handler pure and side-effect free.

### `[MODIFY]` `src/worker.tsx`

Import `helloHandler`.

Register `route("/hello", helloHandler)` before `render(Document, [route("/", Home)])`.

Leave the existing route order intact so API routes continue to bypass SSR.

### `[NEW]` `src/app/hello.test.ts`

Test the GET response status.

Test the JSON content type.

Test the response body exactly equals `{"greeting":"hello world"}`.

Keep the unit test focused on the handler payload; let the framework provide 405 behavior for other verbs.

---

## Behavior Spec

```gherkin
Feature: /hello endpoint

  Scenario: GET /hello returns the greeting
    Given the server is running
    When a GET request is sent to /hello
    Then the response status is 200
    And the response body is exactly {"greeting":"hello world"}
    And the Content-Type header contains "application/json"

  Scenario: Non-GET methods are rejected
    Given the server is running
    When a POST request is sent to /hello
    Then the response status is 405
```

---

## Types & Data Structures

```ts
type HelloResponse = {
  greeting: "hello world";
}
```

The payload is intentionally minimal. Using a literal string response keeps the contract stable and makes the unit test exact rather than fuzzy.

---

## Invariants & Constraints

1. The route must use a lowercase `get` handler key so rwsdk recognizes it.
2. The route must be registered before `render(...)` so it bypasses SSR.
3. The response must remain JSON and must not introduce extra fields.
4. The endpoint must remain public and side-effect free.
5. Unsupported methods must return 405 through the framework's default method dispatch.

---

## Tasks

- [ ] Add a route module under `src/app/` for the hello endpoint.
- [ ] Register `GET /hello` in the worker before the render pipeline.
- [ ] Add a co-located unit test for status, content type, and exact JSON body.
- [ ] Leave unsupported-method behavior to rwsdk's default 405 handling.

---

## Relevant Learnings & Decisions

**Route placement:** The endpoint still needs to be registered before the render pipeline so it returns a raw `Response` instead of entering page rendering.

**Directory choice:** This draft keeps route-specific code in `src/app/` because that is where the other endpoint modules already live. That makes HTTP surface area easier to audit than splitting new endpoints between `src/app/` and `src/lib/`.

**Test scope:** The test stays narrow and synchronous. It verifies the handler payload directly instead of introducing a broader worker harness, which keeps the change small and the failure modes easy to isolate.

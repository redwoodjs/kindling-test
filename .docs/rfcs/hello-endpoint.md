# RFC: Add `/hello` Endpoint

**Date**: 2026-04-16  
**Author**: DeveloperA  
**Status**: Draft

---

## 2000ft View

Add a minimal `/hello` API endpoint that returns a plain JSON greeting for smoke checks, examples, and local verification. The route responds to `GET /hello` with `200 OK` and a small JSON body shaped like `{"greeting":"hello world"}`. It is intentionally public, stateless, and free of side effects.

The endpoint should behave like the existing JSON routes in the worker: register as a lowercase method handler, live outside the React rendering pipeline, and rely on `Response.json(...)` for serialization and headers.

---

## Implementation Breakdown

### `[NEW]` `src/lib/hello.ts`

Export a `helloHandler` function that returns:

```ts
Response.json({ greeting: "hello world" })
```

This keeps the route logic tiny and directly testable without standing up a worker runtime. The handler should not read request state, mutate module state, or introduce any configuration.

### `[MODIFY]` `src/worker.tsx`

Import `helloHandler` and register the route with lowercase method dispatch:

```ts
route("/hello", { get: helloHandler })
```

Place the route before the `render(Document, [...])` entry so the request is resolved at the API-routing layer and never enters the SSR path. Keep it alongside the other API routes already registered in the worker.

### `[NEW]` `src/lib/hello.test.ts`

Add a colocated Node test that calls `helloHandler()` directly and asserts:

- HTTP status is `200`
- `Content-Type` includes `application/json`
- the parsed body is exactly `{ greeting: "hello world" }`

Because the handler is a plain function, the test stays fast and framework-agnostic. Route-level method rejection is covered by the framework contract, not by custom handler code.

---

## Behavior Spec

```gherkin
Feature: GET /hello

  Scenario: GET /hello returns a JSON greeting
    Given the server is running
    When I send GET /hello
    Then the response status is 200
    And the response body is exactly {"greeting":"hello world"}
    And the Content-Type header contains "application/json"

  Scenario: Non-GET methods are rejected
    Given the server is running
    When I send POST /hello
    Then the response status is 405
```

---

## Types & Data Structures

```ts
type HelloResponse = {
  greeting: "hello world";
};
```

The literal string keeps the contract explicit and prevents accidental drift to a different greeting payload.

---

## Invariants & Constraints

1. **GET only**: the route is registered as `{ get: helloHandler }`, so unsupported methods are handled by the framework with `405`.
2. **JSON response**: use `Response.json(...)` instead of manual stringification to keep the handler concise and set headers correctly.
3. **Route order matters**: register `/hello` before `render(...)` so the SSR pipeline does not intercept the request.
4. **No side effects**: the handler must not depend on time, random values, request context, or external services.
5. **Co-located tests**: place the test next to the handler under `src/lib/` so it is picked up by the existing `src/**/*.test.ts` glob with no tooling changes.

---

## Tradeoffs

- A standalone handler module adds one extra file, but it matches the existing `/ping` route style and keeps the implementation easy to test.
- Returning JSON instead of plain text is slightly more verbose for a hello-world route, but it preserves consistency with the repository’s other API endpoints.
- Letting the framework produce `405` responses keeps the code small, but it means method-rejection behavior is validated at the route/spec level rather than inside the handler itself.

---

## Tasks

- [ ] Create `src/lib/hello.ts` with a `helloHandler` that returns a JSON greeting
- [ ] Register `route("/hello", { get: helloHandler })` in the worker before `render(...)`
- [ ] Add `src/lib/hello.test.ts` with assertions for status, JSON content type, and body shape
- [ ] Verify that `POST /hello` is rejected with `405` by the framework contract


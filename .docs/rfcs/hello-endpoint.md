# RFC: Add /hello Endpoint

**Date:** 2026-04-15
**Status:** Draft

---

## 2000ft View Narrative

Add a minimal public greeting endpoint that returns a small JSON payload with a friendly message. The endpoint is read-only, has no side effects, and should behave like the other simple Worker routes in this repository: it is registered before the React render pipeline and returns directly from the API layer.

The intent is to keep the feature as small as possible while still matching the app's current routing and response conventions. The route should remain separate from the homepage so the existing SSR entrypoint is unchanged.

---

## Implementation Breakdown

**[NEW]** `src/lib/hello.ts`
Export a `helloHandler` function that returns `Response.json({ message: "Hello, world!" })`. Keep it side-effect free and make no assumptions about request state.

**[MODIFY]** `src/worker.tsx`
Register `route("/hello", { get: helloHandler })` alongside the existing top-level API routes and keep it before the `render(Document, [route("/", Home)])` entry so the request bypasses the SSR pipeline.

**[NEW]** `src/lib/hello.test.ts`
Add Node test coverage for the handler's success response: HTTP 200, JSON content type, and the exact greeting body.

**[MODIFY]** `.docs/blueprints/api-routes.md`
Update the route blueprint during finalization so the documented API surface includes the new greeting endpoint explicitly.

---

## Behavior Spec

```gherkin
Feature: GET /hello

  Scenario: Greeting request succeeds
    Given the server is running
    When a GET request is sent to /hello
    Then the response status is 200
    And the response body is {"message": "Hello, world!"}
    And the Content-Type header contains "application/json"

  Scenario: Non-GET requests are rejected
    Given the server is running
    When a POST request is sent to /hello
    Then the response status is 405
```

---

## Types & Data Structures

```ts
type HelloResponse = {
  message: "Hello, world!";
}
```

The response should be serialized with `Response.json()` so the runtime sets the JSON content type automatically.

---

## Invariants & Constraints

1. The route is public and requires no authentication.
2. The route is read-only and has no side effects.
3. The route must be registered before the React render pipeline.
4. Only GET is handled explicitly; the router should return 405 for other methods.
5. The response body must stay exactly `{"message":"Hello, world!"}`.

---

## Tasks

- [ ] Create the greeting handler in the shared utility layer.
- [ ] Register the new route in the worker before the render pipeline.
- [ ] Add unit tests covering the success response contract.
- [ ] Run `pnpm test` to confirm the new test is picked up.
- [ ] Run `pnpm types` to confirm the new files type-check.
- [ ] Smoke-check locally with `pnpm dev`, then request `/hello` with GET and POST.
- [ ] Confirm GET returns `200 OK` with the greeting JSON body and POST returns `405 Method Not Allowed`.
- [ ] Update the API routes blueprint during finalization.

---

## Relevant Learnings & Decisions

- The repo already uses top-level route registration before the render pipeline for API endpoints, as shown by the existing route map in the Worker entrypoint.
- The repository's method-handler convention uses lower-case verbs and relies on the router to return 405 for unregistered methods.
- The existing test script already matches `src/**/*.test.ts`, so the hello test can live beside the handler without changing the test runner.
- The local smoke check should use the repo's dev command, which is `pnpm dev`, so verification stays aligned with the current development workflow.

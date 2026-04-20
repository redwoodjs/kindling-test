# RFC: Add /hello Endpoint

**Date:** 2026-04-15
**Status:** Implemented

---

## 2000ft View

Add a `/hello` HTTP endpoint that returns `{"message": "Hello, World!"}` with HTTP 200. The endpoint has no side effects, requires no authentication, and serves as a minimal demonstration that the Worker is reachable and routing correctly. It is a pure API route: it does not touch the React/RSC rendering pipeline.

---

## Implementation Breakdown

**[NEW] `src/lib/hello.ts`**
Export `helloHandler` — a function returning `Response.json({ message: "Hello, World!" })`. Co-locating it in `src/lib/` makes it independently testable and matches the pattern established by `src/lib/ping.ts`, which is the closest analogue (a simple stateless handler with no dependencies).

**[MODIFY] `src/worker.tsx`**
Register `route("/hello", { get: helloHandler })` in the `defineApp` array, **before** the `render(Document, [...])` call. This ensures the request is intercepted at the routing layer before the React SSR pipeline can claim it.

Import `helloHandler` from `@/lib/hello`.

**[NEW] `src/lib/hello.test.ts`**
Unit tests for `helloHandler` using `node:test` + `node:assert`, following the conventions in `src/lib/ping.test.ts`. Tests call the handler directly — no HTTP server required.

---

## Behavior Spec

```gherkin
Feature: /hello endpoint

  Scenario: GET /hello returns Hello, World!
    Given the server is running
    When a GET request is sent to /hello
    Then the response status is 200
    And the response body is {"message": "Hello, World!"}
    And the Content-Type header contains "application/json"

  Scenario: Non-GET method returns 405
    Given the server is running
    When a POST request is sent to /hello
    Then the response status is 405
```

---

## Types & Data Structures

No new types. The response payload shape:

```ts
{ message: "Hello, World!" }  // message is a string literal
```

`Response.json()` is used (available in the Cloudflare Workers runtime and Node ≥ 18), which sets `Content-Type: application/json` automatically.

---

## Invariants & Constraints

- `message` must be the string `"Hello, World!"` (capital H, capital W, comma-space, exclamation mark)
- HTTP status must be 200 on success
- No authentication, no DB access, no side effects, no state
- The route must not interfere with existing routes (`/`, `/ping`, `/health`, `/status`)
- The 405 behavior on non-GET methods is handled automatically by rwsdk's `MethodHandlers` dispatch — no manual handling needed

---

## Tasks

- [x] Create `src/lib/hello.ts` exporting `helloHandler`
- [x] Modify `src/worker.tsx` to add `import { helloHandler } from "@/lib/hello"` and register `route("/hello", { get: helloHandler })`
- [x] Create `src/lib/hello.test.ts` with unit tests covering: HTTP 200, correct body shape, message value, Content-Type
- [x] Run `pnpm test` — all tests pass
- [x] Run `pnpm types` — no type errors

---

## Relevant Learnings & Decisions

**Why `src/lib/hello.ts` (not `src/app/pages/hello.ts`)?**
The `src/lib/` directory holds pure, framework-agnostic utility modules (e.g., `ping.ts`, `math.ts`). The `src/app/pages/` directory holds React page components or handlers with application-level concerns (e.g., `health.ts`, which owns startup state). A stateless hello world response has no application-level concerns; `src/lib/` is the right home.

**Route placement:** The `/hello` route must be placed before `render(Document, [...])` in the `defineApp` array. The `render()` wrapper injects SSR middleware and must not be reached for plain API routes. All existing API routes (`/status`, `/health`, `/ping`) are placed before `render()`.

**`Response.json()` vs `new Response(JSON.stringify(...))`:** `Response.json()` is the idiomatic choice in this project (used by `ping.ts` and `health.ts`) and sets `Content-Type: application/json` automatically.

**Method casing:** `{ get: helloHandler }` — lowercase verb, per the `MethodVerb` type in rwsdk. See `.docs/learnings/rwsdk-route-method-verbs.md`.

**Test script coverage:** `pnpm test` runs `node --import tsx --test 'src/**/*.test.ts'`, which picks up all `*.test.ts` files under `src/`. A new `src/lib/hello.test.ts` is automatically included.

**Blueprint:** `.docs/blueprints/api-routes.md` already documents `GET /hello`, so no additional blueprint update was needed at closeout.

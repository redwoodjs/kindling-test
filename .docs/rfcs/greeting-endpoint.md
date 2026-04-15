# RFC: Add /greeting Endpoint

**Date:** 2026-04-15
**Status:** Implemented

---

## 2000ft View

Add a `/greeting` endpoint that returns the plain-text string `hello world`. The endpoint has no authentication, no side effects, and exists solely as a minimal smoke test confirming the route is reachable and returns a non-JSON response.

This is a pure API route: it does not go through the React/RSC rendering pipeline.

---

## Implementation Breakdown

**[NEW] `src/lib/greeting.ts`**
Export `greetingHandler` — a function that returns `new Response("hello world", { headers: { "Content-Type": "text/plain" } })`. The `new Response()` constructor (not `Response.json()`) is required because the body is plain text.

**[MODIFY] `src/worker.tsx`**
Register `route("/greeting", { get: greetingHandler })` before `render(Document, [...])`.

**[NEW] `src/lib/greeting.test.ts`**
Unit tests using Node's built-in `node:test` runner, calling `greetingHandler` directly.

---

## Behavior Spec

```
GET /greeting → 200, Content-Type: text/plain, body: "hello world"
POST /greeting → 405
```

---

## Invariants & Constraints

- The response body is exactly the string `hello world` with no quotes
- `Content-Type` is `text/plain`
- HTTP status is 200 on success
- Non-GET methods return 405 automatically via rwsdk's `MethodHandlers`
- No authentication, no DB access, no side effects

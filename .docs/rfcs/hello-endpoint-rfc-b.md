# RFC B: Add `GET /hello` Greeting Endpoint

**Date**: 2026-04-15  
**Author**: DeveloperB  
**Status**: Draft (for arbitration)

---

## 2000ft View

Add a minimal API endpoint at `GET /hello` that returns HTTP `200` with JSON body `{ "message": "hello world" }`.  
The endpoint is intentionally static, side-effect free, and framework-native so it can be used for onboarding checks and simple smoke validation.

This endpoint is an API route, not a rendered page route, and must remain outside the React render pipeline.

---

## Alternative Design Direction

This draft uses a **method-handlers module** pattern (matching `status`) instead of a bare function + wrapper pattern (used by `health` and `ping`).

- Create a new module that exports a `helloHandler` object with only a `get` method.
- Register that object directly in the centralized worker route table.
- Rely on RedwoodSDK's built-in method dispatch for `405` on unsupported verbs.

Why this alternative:
- It encodes allowed methods at the handler boundary itself.
- It keeps worker wiring simpler (`route("/hello", helloHandler)`).
- It makes unsupported-method behavior explicit in route shape while preserving framework defaults.

---

## Likely Files To Change

- **[NEW]** `src/app/hello.ts`  
  Export `helloHandler` as a method-handlers object:
  - `get` returns `Response.json({ message: "hello world" })`
- **[MODIFY]** `src/worker.tsx`  
  - Import `helloHandler`
  - Register `route("/hello", helloHandler)` in the top-level `defineApp([...])` list
  - Place route before `render(Document, ...)`
- **[NEW]** `src/app/hello.test.ts` (or project-preferred API test location)  
  - Add contract tests for success payload and content type
  - Add unsupported-method behavior verification aligned with framework semantics

No changes are planned for existing `/`, `/health`, `/ping`, or `/status` handlers.

---

## Route Registration Strategy

Register `/hello` in `src/worker.tsx` alongside other top-level API routes, after middleware setup and before `render(...)`.

Expected ordering characteristics:
- `setCommonHeaders()` still runs before `/hello` and therefore headers are inherited.
- `/hello` resolves as an API response without entering SSR/RSC rendering.
- Existing routes continue to match exactly as they do today.

---

## Response Contract

### Success
- Method: `GET`
- Path: `/hello`
- Status: `200`
- Body: exact JSON object `{ "message": "hello world" }`
- Content-Type: includes `application/json`

### Unsupported Methods
- Example: `POST /hello`
- Status: `405`
- Handling source: framework default method-handler dispatch (no custom `POST` handler)

---

## Verification Plan

1. Unit-test handler success response:
   - status is `200`
   - `Content-Type` includes `application/json`
   - parsed body deep-equals `{ message: "hello world" }`
2. Verify unsupported method behavior for `/hello` returns `405` using the project's established endpoint-testing approach.
3. Confirm existing routes still behave the same (`/`, `/health`, `/ping`, `/status`).
4. Run project checks:
   - `pnpm test`
   - `pnpm types`
5. Manual smoke check:
   - `GET /hello` returns expected JSON
   - `POST /hello` returns `405`

---

## Risks And Mitigations

- **Risk: Route ordering regression**  
  If `/hello` is registered after `render(...)`, requests may enter page rendering instead of API routing.  
  **Mitigation**: enforce registration before `render(...)`.

- **Risk: Method key casing mistakes**  
  Using uppercase `GET` would not register correctly in RedwoodSDK.  
  **Mitigation**: use lowercase `get` in handler object.

- **Risk: Contract drift (extra fields or different payload text)**  
  Consumers may depend on exact payload shape.  
  **Mitigation**: assert exact deep equality in tests.

- **Risk: Header inheritance assumptions**  
  Middleware order controls header presence.  
  **Mitigation**: keep endpoint in the existing middleware chain and verify common headers in endpoint tests.

---

## Non-Goals

- No authentication or authorization changes.
- No modifications to existing endpoint behavior.
- No new shared response abstraction or refactor of current handlers.
- No expansion beyond the single greeting contract.

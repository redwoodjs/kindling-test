# RFC: Greeting Endpoint Implementation (Minimal Pattern)

## 2000ft View Narrative

We are adding the first HTTP endpoint to the API: a greeting resource returning a static JSON response. The greeting endpoint is intentionally simple—no database queries, no external calls, no complex business logic.

**Design Philosophy**: We propose a **minimal, flat-structure approach** that keeps code simple and organization minimal until complexity justifies additional structure. The greeting endpoint is the only user-facing API at present. Adding elaborate directory trees, middleware abstractions, and separated handler files anticipates future scale that we have not yet reached. We should avoid pre-mature architecture—structure should emerge from patterns, not be imposed from the start.

**What and Why**: The brief asks for `GET /api/v1/greeting` returning `{ "message": "hello world" }` with proper HTTP semantics.

**How**: We implement the greeting endpoint with minimal ceremony:
- **Server entry point** (`src/server.ts`): Express app initialization, route registration, error handling, and listener binding in one place.
- **Inline handler logic**: Route handler defined directly in the server file, keeping the greeting endpoint code visible and easy to understand.
- **Simple error handling**: Middleware-based error handling that catches exceptions and returns consistent error responses.

This approach keeps the codebase easy to navigate and modify. As the API grows and patterns emerge (multiple similar endpoints, shared logic, cross-cutting concerns), we can extract structure incrementally—routes to a dedicated router file, handlers to separate modules, middleware to dedicated files. Until that point, the single-file approach minimizes indirection and maintains clarity.

---

## Database Changes

**None.** The greeting endpoint requires no database interaction.

---

## Behavior Spec (Gherkin)

```gherkin
Feature: Greeting Endpoint

  Scenario: Client requests the greeting
    Given the greeting endpoint is available at GET /api/v1/greeting
    When a client makes a GET request to /api/v1/greeting
    Then the response status is 200
    And the response body is valid JSON: { "message": "hello world" }
    And the Content-Type header is application/json; charset=utf-8
    And the Cache-Control header is set to public, max-age=3600

  Scenario: Client requests with unsupported method
    Given the greeting endpoint at /api/v1/greeting supports GET only
    When a client makes a POST request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the Allow header lists GET

  Scenario: Client requests nonexistent path
    Given the greeting endpoint at /api/v1/greeting
    When a client makes a GET request to /api/v1/nonexistent
    Then the response status is 404 Not Found
    And the response body is valid JSON with an error message

  Scenario: Server error during request handling
    Given the greeting endpoint is available
    When an unexpected error occurs during request processing
    Then the response status is 500 Internal Server Error
    And the response body contains an error message
```

---

## API Reference

### GET /api/v1/greeting

**Summary**: Returns a greeting message.

**Request**:
- **Method**: GET
- **Path**: `/api/v1/greeting`
- **Headers**: None required
- **Body**: None

**Response (200 OK)**:
```json
{
  "message": "hello world"
}
```

**Headers**:
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=3600`

**Error Responses**:
- **404 Not Found**: Path does not exist. Body: `{ "error": "Not Found" }`
- **405 Method Not Allowed**: Method not supported. Body: `{ "error": "Method Not Allowed" }`. Headers: `Allow: GET`
- **500 Internal Server Error**: Unexpected server error. Body: `{ "error": "Internal Server Error" }`

---

## Implementation Breakdown

### [NEW] Server Entry Point (`src/server.ts`)
- Initialize Express app with JSON body parser middleware
- Define GET `/api/v1/greeting` route handler inline
  - Handler constructs response object `{ message: "hello world" }`
  - Attaches response headers (Content-Type, Cache-Control)
  - Returns JSON via `res.json()`
- Register error handling middleware at end of middleware chain
  - Catches exceptions thrown during request processing
  - Returns consistent error response format with appropriate status codes
- Export app instance for testing
- Export async startup function that binds HTTP listener to port

### [NEW] Process Entry Point (`src/index.ts`)
- Import server module
- Call startup function to bind listener
- Handle process signals (SIGTERM, SIGINT) for graceful shutdown

**Rationale**: With a single endpoint, keeping the route definition and handler logic together in one file (src/server.ts) minimizes navigation and makes the greeting endpoint self-contained. As more endpoints are added, patterns will emerge—at that point, we can extract routes and handlers to separate modules without disrupting the greeting endpoint. This defers architectural decisions until they are justified by complexity.

---

## Directory & File Structure

```
src/
├── index.ts           # Process entry point: startup and signal handling
└── server.ts          # Express app, greeting route, error handling, listener binding
```

This flat structure is intentionally minimal. Future endpoints will be added to `src/server.ts` until the file grows large enough to justify splitting routes or handlers into separate modules. The structure evolves with the codebase.

---

## Types & Data Structures

### Greeting Response

```typescript
interface GreetingResponse {
  message: string; // Always "hello world"
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: string; // Error message, e.g., "Not Found"
}
```

### Request/Response Context

We use Express types directly:

```typescript
import { Request, Response, NextFunction } from 'express';

type Handler = (req: Request, res: Response) => void;
type ErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => void;
```

---

## Invariants & Constraints

1. **Response Format**: Every response to `GET /api/v1/greeting` must be valid JSON with the structure `{ "message": "hello world" }`. The message must be exactly `"hello world"` (lowercase).

2. **Content-Type**: All responses must include `Content-Type: application/json; charset=utf-8`.

3. **Caching**: Responses must include `Cache-Control: public, max-age=3600`.

4. **HTTP Semantics**:
   - 200: Successful retrieval.
   - 404: Path does not exist.
   - 405: Method not supported; `Allow: GET` header present.
   - 500: Unexpected server error.

5. **Idempotency**: The endpoint is idempotent. Multiple identical requests produce identical responses with no side effects.

6. **Statelessness**: No state lookup, session management, or context required. Response is deterministic.

---

## System Flow (Snapshot Diff)

### Before (Empty API)
```
Client Request → 404 Not Found
```

### After (With Greeting Endpoint)
```
Client Request (GET /api/v1/greeting)
  ↓
Express Routing (matches /api/v1/greeting)
  ↓
Handler (constructs { message: "hello world" })
  ↓
Response Serialization (JSON with headers)
  ↓
HTTP Response (200 OK + body)
```

For errors:
```
Client Request (invalid path or method)
  ↓
Express Routing (no match, or method not allowed)
  ↓
Error Handler Middleware (catches exception or routing error)
  ↓
Error Response (status + JSON error object)
  ↓
HTTP Response (4xx/5xx + body)
```

---

## Suggested Verification

Manual verification steps:

```bash
# Success case
curl -i http://localhost:3000/api/v1/greeting
# Expected: 200 OK, Content-Type: application/json; charset=utf-8,
# Cache-Control: public, max-age=3600, body: { "message": "hello world" }

# 404 Not Found
curl -i http://localhost:3000/api/v1/nonexistent
# Expected: 404, JSON error response

# 405 Method Not Allowed
curl -i -X POST http://localhost:3000/api/v1/greeting
# Expected: 405, Allow: GET header, JSON error response
```

---

## Tasks

- [ ] Initialize Express app in `src/server.ts`
- [ ] Register JSON body parser middleware
- [ ] Define GET `/api/v1/greeting` route with inline handler
- [ ] Attach response headers (Content-Type, Cache-Control)
- [ ] Register error handling middleware
- [ ] Create process entry point (`src/index.ts`)
- [ ] Export app and startup functions for testing
- [ ] Test endpoint with curl (manual verification)
- [ ] Run integration tests (written by QA track)

---

## Rationale & Design Tradeoffs

### Why Minimal Structure?

**Simplicity over Anticipation**: The greeting endpoint is a single, simple piece of logic. Separating it into multiple files (route, handler, middleware) creates indirection without corresponding benefit. A developer reading `src/server.ts` immediately sees how the endpoint works.

**Refactoring as we grow**: When a second or third endpoint is added, patterns will emerge. At that point, extracting a dedicated routes file, handler modules, or shared middleware becomes justified by concrete need, not speculation. Refactoring from flat-to-modular is straightforward and low-risk.

**Lower cognitive load for new team members**: A new developer can understand the entire API structure by reading one file. No need to navigate between handlers/, routes/, middleware/—the core logic is visible.

### Why not the structured approach?

The first RFC proposes elaborate directory trees and module separation *before* multiple endpoints or complex logic exists. This pre-maturely commits to structure that may not fit future requirements. We may discover, for example, that handlers need shared state (dependency injection), making the pure-function approach awkward—at which point we'd refactor anyway.

### Evolutionary Architecture

As the API evolves, the structure can evolve with it:
- **1-2 endpoints**: Flat, single-file (this RFC)
- **3-5 endpoints with shared patterns**: Extract routes.ts, handlers/ directory
- **Complex middleware chains**: Extract middleware/ directory
- **Cross-cutting concerns (auth, logging)**: Establish middleware composition patterns
- **Shared business logic**: Extract utils/ or services/ as needed

This approach avoids over-engineering while remaining flexible.

---

## Implementation Notes

### Error Handling Strategy

Instead of a centralized error middleware in a separate file, we use Express's built-in error handler (a middleware with 4 parameters). This is idiomatic Express and requires no additional abstraction:

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const status = (err as any).status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});
```

This catches exceptions thrown during request processing and returns a consistent error response. No separate middleware/ directory is needed.

### Response Headers

Headers are attached directly in the route handler:

```typescript
app.get('/api/v1/greeting', (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ message: 'hello world' });
});
```

This keeps the endpoint definition self-contained.

---

## Summary

This RFC proposes a minimal, flat-structure approach that prioritizes clarity and simplicity for the current scope. The endpoint is fully functional, follows HTTP semantics, and establishes a foundation that can evolve as the API grows. Structure is added when patterns demand it, not in anticipation of future scale.

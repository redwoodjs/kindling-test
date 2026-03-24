# RFC: Greeting Endpoint Implementation

## 2000ft View Narrative

We are adding the first HTTP endpoint to the API: a greeting resource that returns a static JSON response. The greeting endpoint is a foundation for the API—it establishes routing conventions, response formats, and error handling patterns that future endpoints will follow.

The endpoint is intentionally simple: it performs no database queries, no external calls, and no input validation. Its simplicity allows us to focus on establishing clean patterns rather than business logic complexity. The response is cacheable and stateless, making it ideal for testing the full request/response pipeline.

**What and Why**: The brief asks for a greeting endpoint returning "hello world". This is a straightforward feature that lets us validate the API infrastructure (routing, response formatting, caching headers) before adding complex endpoints. The ideation phase established the design: `GET /api/v1/greeting` returning `{ "message": "hello world" }` with appropriate HTTP headers and error handling.

**How**: We implement a modular handler pattern:
- **Server entry point** (`src/server.ts`): Initializes Express, mounts routes, starts the listener.
- **Route definition** (`src/routes/api/v1/greeting.ts`): Exports an Express router with the GET handler and middleware.
- **Handler logic** (`src/handlers/greetingHandler.ts`): Pure handler function that constructs the response, separating HTTP concerns from business logic.
- **Error middleware** (`src/middleware/errorHandler.ts`): Centralized error handling for consistent error responses.

This separation allows tests to exercise the handler independently, and makes it easy to add middleware (auth, logging, validation) later.

---

## Database Changes

**None.** The greeting endpoint requires no database interaction. It is purely a computed response.

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
- **405 Method Not Allowed**: Method not supported (e.g., POST). Body: `{ "error": "Method Not Allowed" }`. Headers: `Allow: GET`
- **500 Internal Server Error**: Unexpected server error. Body: `{ "error": "Internal Server Error" }`

---

## Implementation Breakdown

### [NEW] Server Entry Point (`src/server.ts`)
- Initialize Express app
- Register global middleware (body parser, error handler)
- Mount `/api/v1` route group
- Bind HTTP listener to configurable port
- Export app for testing

### [NEW] Greeting Route Handler (`src/routes/api/v1/greeting.ts`)
- Export Express router
- Register GET handler
- Delegate to `greetingHandler`
- Attach response headers (Content-Type, Cache-Control)

### [NEW] Greeting Handler (`src/handlers/greetingHandler.ts`)
- Pure handler function: `(req, res) => void`
- Construct response object `{ message: "hello world" }`
- Return JSON via `res.json()`

### [NEW] Error Middleware (`src/middleware/errorHandler.ts`)
- Global error handler middleware
- Catch unhandled errors
- Return consistent error response format
- Preserve HTTP semantics (status codes, headers)

### [NEW] Main Entry Point (`src/index.ts`)
- Import server
- Call server startup logic
- Handle process signals (SIGTERM, SIGINT)

---

## Directory & File Structure

```
src/
├── index.ts                      # Process entry point
├── server.ts                     # Express app initialization and mounting
├── handlers/
│   └── greetingHandler.ts        # Handler logic for greeting endpoint
├── routes/
│   └── api/
│       └── v1/
│           └── greeting.ts       # GET /api/v1/greeting router
├── middleware/
│   └── errorHandler.ts           # Global error handler
└── types/
    └── index.ts                  # Shared TypeScript types (optional, seeded empty)
```

---

## Types & Data Structures

### Greeting Response

```typescript
interface GreetingResponse {
  message: string; // The greeting message, always "hello world"
}
```

### Error Response (Global)

```typescript
interface ErrorResponse {
  error: string; // Error message, e.g., "Not Found", "Method Not Allowed"
}
```

### HTTP Request/Response Context

We use Express types directly:
```typescript
import { Request, Response } from 'express';

type GreetingHandler = (req: Request, res: Response) => void;
```

---

## Invariants & Constraints

1. **Response Format Invariant**: Every response to `GET /api/v1/greeting` must be valid JSON with the structure `{ "message": "hello world" }`. The message value must be exactly `"hello world"` (lowercase).

2. **Content-Type Invariant**: All responses from the greeting endpoint must include the header `Content-Type: application/json; charset=utf-8`.

3. **Caching Invariant**: Responses to `GET /api/v1/greeting` must include the header `Cache-Control: public, max-age=3600`.

4. **HTTP Semantics**:
   - 200 responses indicate successful retrieval.
   - 404 responses indicate the path does not exist.
   - 405 responses indicate the method is not supported; the `Allow: GET` header must be present.
   - 500 responses indicate an unexpected server error.

5. **Idempotency**: The endpoint is idempotent. Multiple identical requests produce identical responses with no side effects.

6. **Statelessness**: The endpoint requires no state lookup, session management, or context. Its response is deterministic and independent of prior requests.

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
Express Router (matches /api/v1/greeting)
  ↓
Greeting Handler (constructs { message: "hello world" })
  ↓
Response Middleware (attaches headers: Content-Type, Cache-Control)
  ↓
HTTP Response (200 OK + JSON body)
```

---

## Suggested Verification

The user (or QA) should verify the endpoint with these manual steps:

```bash
# Basic success case
curl -i http://localhost:3000/api/v1/greeting

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# Cache-Control: public, max-age=3600
# { "message": "hello world" }

# Test 404 Not Found
curl -i http://localhost:3000/api/v1/nonexistent

# Test 405 Method Not Allowed
curl -i -X POST http://localhost:3000/api/v1/greeting
# Expected: 405 with Allow: GET header
```

---

## Tasks

- [ ] Initialize Express server with error middleware
- [ ] Define greeting route handler with response object
- [ ] Mount greeting router at `/api/v1/greeting`
- [ ] Attach Content-Type and Cache-Control headers
- [ ] Implement 404 and 405 error handling
- [ ] Create process entry point (`src/index.ts`)
- [ ] Test endpoint with curl (manual verification)
- [ ] Run integration tests (written by QA track)


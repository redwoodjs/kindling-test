# Greeting Endpoint - Behavioral Specifications

## Overview
The greeting endpoint is a simple HTTP endpoint that responds with "hello world" text. It is a read-only, stateless endpoint with no parameters or side effects.

## Behavioral Specifications (Black-Box Contract)

### Scenario 1: Happy Path - User Requests Greeting
**Given:** The application is running
**When:** A GET request is made to the greeting endpoint
**Then:**
- Response HTTP status code is 200 (OK)
- Response body contains the text "hello world" (exact format TBD by implementation)
- Response includes a Content-Type header indicating the media type

### Scenario 2: Consistency and Stability
**Given:** The application is running
**When:** Multiple sequential GET requests are made to the greeting endpoint
**Then:**
- All responses have HTTP status code 200
- All response bodies are identical
- All responses contain "hello world"
- The endpoint behaves consistently across multiple requests

### Scenario 3: Response Validity
**Given:** The application is running
**When:** A GET request is made to the greeting endpoint
**Then:**
- The response body is not empty
- The response Content-Type header is present and appropriate (text/plain, text/html, application/json, etc.)
- The response follows standard HTTP response semantics

## Implementation Notes for Developer

1. **Endpoint Path**: To be determined in RFC (e.g., `/greeting`, `/api/greeting`, `/hello`)
2. **HTTP Method**: GET (read-only greeting)
3. **Request Parameters**: None required
4. **Response Format**: Implementation choice (plain text or JSON are both valid)
5. **Status Code**: 200 for success
6. **Headers**: Must include appropriate Content-Type header
7. **State**: Stateless endpoint with no side effects or database operations
8. **Integration**: Should integrate with the existing routing system in `worker.tsx`

## Test Coverage

The test file `src/greeting.spec.ts` contains integration tests that verify:
- HTTP 200 response status
- Response body contains "hello world"
- Response has Content-Type header
- Response stability across multiple requests
- Response body is not empty

Tests are written as black-box integration tests and do not depend on implementation details. They verify only the observable HTTP interface contract.

## Notes for QA/Test Validation

- Exact endpoint path will be confirmed after RFC is published
- Tests assume endpoint accessible at `http://localhost:5173/greeting` (adjust path post-RFC)
- Tests run via `npm test` command
- Tests can be run during development with `npm run test:ui`

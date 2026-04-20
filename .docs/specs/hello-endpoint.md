# Behavioral Specs: GET /hello Endpoint

**Derived from**: task intent — "add a hello world HTTP endpoint that returns a JSON greeting"
**Not derived from**: implementation source code

---

## Observable Interface

The endpoint is accessible via HTTP `GET /hello`. All scenarios are verifiable through the response object (status code, headers, body) with no knowledge of internal implementation.

---

## Scenarios

### 1. Happy Path — Status Code

**Scenario**: A GET request to the hello endpoint returns HTTP 200.

- Given a GET request is made to `/hello`
- Then the response status code is `200`

### 2. Happy Path — Content Type

**Scenario**: The response advertises JSON content.

- Given a GET request is made to `/hello`
- Then the `Content-Type` response header includes `application/json`

### 3. Happy Path — Valid JSON Body

**Scenario**: The response body is parseable as JSON.

- Given a GET request is made to `/hello`
- Then the response body parses as valid JSON without error

### 4. Happy Path — Body Shape

**Scenario**: The JSON body contains a `message` field.

- Given a GET request is made to `/hello`
- When the response body is parsed as JSON
- Then the object has a key named `message`

### 5. Exact Message Value

**Scenario**: The greeting is the canonical "Hello, World!" string.

- Given a GET request is made to `/hello`
- When the response body is parsed as JSON
- Then `body.message` equals `"Hello, World!"` exactly
  - Capital H in "Hello"
  - Capital W in "World"
  - Comma immediately after "Hello"
  - Single space between "Hello," and "World!"
  - Exclamation mark at the end

### 6. No Extra Fields

**Scenario**: The response body contains only the `message` field (no extra keys).

- Given a GET request is made to `/hello`
- When the response body is parsed as JSON
- Then the object has exactly one key: `message`

### 7. Method Restriction — Non-GET Methods Rejected

**Scenario**: Requests using HTTP methods other than GET are rejected with 405.

- Given a request is made to `/hello` using any non-GET method (POST, PUT, DELETE, PATCH, HEAD-with-body, etc.)
- Then the response status code is `405`

> **Note on testability**: In this project, method restriction is enforced by the framework's routing layer, not by the handler function itself. The handler function can be unit-tested for scenarios 1–6 by calling it directly. Scenario 7 is framework-enforced behavior. If it cannot be covered at the unit-test level, it should be documented as a known gap (framework guarantee) rather than skipped silently.

### 8. Idempotency

**Scenario**: The response is deterministic — repeated GET requests return the same greeting.

- Given two GET requests are made to `/hello` in sequence
- Then both responses have status `200` and `body.message === "Hello, World!"`

---

## Out of Scope

- Authentication / authorization (endpoint is public)
- Rate limiting
- Response caching headers
- Error conditions other than wrong HTTP method

---

## Notes for Phase 6 (Test Writing)

- Tests should import the handler function directly and call it — matching the pattern used for `/ping`, `/health`, and `/status`.
- Handler is expected to be a plain function (no factory wrapper needed — no time-dependent state).
- Import must use the explicit `.ts` extension per project conventions.
- Test file should be co-located with the handler source in `src/lib/`.
- Scenario 7 (405) is framework-level; check whether it can be invoked via the handler's exported shape. If not, document the gap and skip rather than write a test that would always pass vacuously.

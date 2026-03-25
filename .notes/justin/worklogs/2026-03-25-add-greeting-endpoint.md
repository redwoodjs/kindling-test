# 2026-03-25 Add Hello World Greeting Endpoint

## Spec Derivation (QA, Track B Phase 1)

### Intent
A simple HTTP endpoint that responds with "hello world". The endpoint serves as a greeting service suitable for health checks, demos, or foundational API capability. It must be discoverable and return the greeting with appropriate HTTP status and content-type.

### Black-Box Behavioral Specs (Gherkin Format)

#### Spec 1: Successful Greeting Response
```
Scenario: GET request to greeting endpoint returns hello world
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting
  Then the response status code is 200
  And the response body is "hello world"
  And the response content-type is "text/plain"
```

#### Spec 2: GET Request Consistency
```
Scenario: Multiple GET requests return consistent responses
  Given the greeting endpoint is deployed
  When an HTTP client makes multiple sequential GET requests to /greeting
  Then each response has status code 200
  And each response body is "hello world"
  And each response has content-type "text/plain"
```

#### Spec 3: Endpoint Path Specificity
```
Scenario: Only the /greeting path serves the greeting
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting
  Then the response is the greeting (status 200, body "hello world")
  When an HTTP client makes a GET request to /greet or /hello or other non-/greeting paths
  Then the response is not the greeting endpoint (404 or page not found)
```

#### Spec 4: HTTP Method Specificity
```
Scenario: GET is the supported method for the greeting endpoint
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting
  Then the response status code is 200
  When an HTTP client makes a HEAD request to /greeting
  Then the response status code is 200 and the response body is empty
  When an HTTP client makes a POST request to /greeting
  Then the response status code is 405 (Method Not Allowed) or other non-success
  When an HTTP client makes a DELETE request to /greeting
  Then the response status code is 405 (Method Not Allowed) or other non-success
```

#### Spec 5: Response Content-Type Header
```
Scenario: Response declares correct content-type
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting
  Then the response includes a Content-Type header
  And the Content-Type value is "text/plain" or "text/plain; charset=utf-8"
```

#### Spec 6: No Request Body Processing
```
Scenario: The greeting endpoint does not require or process request body
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting with no request body
  Then the response status code is 200 and body is "hello world"
  When an HTTP client makes a GET request to /greeting with a request body
  Then the response status code is 200 and body is "hello world"
```

#### Spec 7: Query Parameters Ignored
```
Scenario: Query parameters do not affect the greeting response
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting with no query parameters
  Then the response status code is 200 and body is "hello world"
  When an HTTP client makes a GET request to /greeting?foo=bar or other query strings
  Then the response status code is 200 and body is "hello world"
```

#### Spec 8: Response Timing
```
Scenario: The greeting endpoint responds promptly
  Given the greeting endpoint is deployed
  When an HTTP client makes a GET request to /greeting
  Then the response is received within a reasonable time (< 1 second)
```

### Coverage Assessment

**Primary Path**:
- Spec 1: Happy path — GET /greeting returns 200 with "hello world" in plain text

**Variations**:
- Spec 2: Idempotency and consistency
- Spec 3: Path specificity
- Spec 4: HTTP method handling (GET allowed, POST/DELETE rejected)
- Spec 5: Content-Type header correctness
- Spec 6: Request body handling (ignored)
- Spec 7: Query parameter handling (ignored)
- Spec 8: Performance (optional but useful)

### Notes for Test Writing

1. Tests will verify these specs via HTTP client calls only (black-box principle).
2. No assumptions about implementation framework, internal routing, or data structures.
3. Content-type expectation: "text/plain" is most likely, but "text/plain; charset=utf-8" would also be acceptable.
4. HTTP 405 Method Not Allowed is preferred for unsupported methods, but any non-success code is acceptable for POST/DELETE (the key is that they should not return 200).
5. All specs are independently verifiable using standard HTTP clients (curl, fetch, etc.).

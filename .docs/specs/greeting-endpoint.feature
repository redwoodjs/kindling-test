Feature: Greeting Endpoint

  The greeting endpoint is a simple HTTP resource that returns a static greeting message.
  It serves as a foundation for the API, establishing routing conventions and response patterns.

  The endpoint is stateless, idempotent, and cacheable. It requires no request body,
  authentication, or complex processing.

  Background:
    Given the greeting endpoint is deployed and accessible
    And the application is running on http://localhost:3000

  # ─────────────────────────────────────────────────────────────
  # Happy Path: Successful Greeting Request
  # ─────────────────────────────────────────────────────────────

  Scenario: Client retrieves greeting successfully
    When a client makes a GET request to /api/v1/greeting
    Then the response status is 200 OK
    And the response content-type is application/json; charset=utf-8
    And the response body is valid JSON
    And the response body contains a field "message" with value "hello world"
    And the Cache-Control header is "public, max-age=3600"

  Scenario: Response body has exact structure
    When a client makes a GET request to /api/v1/greeting
    Then the response body matches the schema:
      | Property | Type   | Value         |
      | message  | string | "hello world" |
    And the response body contains no additional properties

  # ─────────────────────────────────────────────────────────────
  # Request Variations: Query Strings and Parameters
  # ─────────────────────────────────────────────────────────────

  Scenario: Greeting request with query parameters is ignored
    When a client makes a GET request to /api/v1/greeting?foo=bar&baz=qux
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  Scenario: Greeting request with empty query string is handled
    When a client makes a GET request to /api/v1/greeting?
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  # ─────────────────────────────────────────────────────────────
  # Request Headers: Standard and Custom
  # ─────────────────────────────────────────────────────────────

  Scenario: Request with Accept header for JSON succeeds
    When a client makes a GET request to /api/v1/greeting
    And sets the Accept header to application/json
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  Scenario: Request with custom headers is handled gracefully
    When a client makes a GET request to /api/v1/greeting
    And sets custom headers:
      | Header        | Value       |
      | User-Agent    | CustomBot/1 |
      | X-Request-ID  | abc123      |
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  Scenario: Request with no headers succeeds
    When a client makes a GET request to /api/v1/greeting
    And sends no optional headers
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  # ─────────────────────────────────────────────────────────────
  # HTTP Methods: Unsupported Methods Return 405
  # ─────────────────────────────────────────────────────────────

  Scenario: POST request is rejected with 405
    When a client makes a POST request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the Allow header is present
    And the Allow header contains "GET"
    And the response body is valid JSON
    And the response body contains an "error" field

  Scenario: PUT request is rejected with 405
    When a client makes a PUT request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the Allow header contains "GET"

  Scenario: DELETE request is rejected with 405
    When a client makes a DELETE request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the Allow header contains "GET"

  Scenario: PATCH request is rejected with 405
    When a client makes a PATCH request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the Allow header contains "GET"

  Scenario: OPTIONS request is handled appropriately
    When a client makes an OPTIONS request to /api/v1/greeting
    Then the response status is either 200 OK or 405 Method Not Allowed
    And if 405, the Allow header contains "GET"

  Scenario: HEAD request is supported (as per HTTP spec)
    When a client makes a HEAD request to /api/v1/greeting
    Then the response status is either 200 OK or 405 Method Not Allowed
    And the response headers are present (Content-Type, Cache-Control)

  # ─────────────────────────────────────────────────────────────
  # Path Routing: Exact Match and 404
  # ─────────────────────────────────────────────────────────────

  Scenario: Request to exact endpoint path succeeds
    When a client makes a GET request to /api/v1/greeting
    Then the response status is 200 OK

  Scenario: Request to nonexistent path returns 404
    When a client makes a GET request to /api/v1/nonexistent
    Then the response status is 404 Not Found
    And the response body is valid JSON
    And the response body contains an "error" field

  Scenario: Request to similar but incorrect path returns 404
    When a client makes a GET request to /api/v1/greetings (note: plural)
    Then the response status is 404 Not Found

  Scenario: Request to root path returns 404
    When a client makes a GET request to /
    Then the response status is 404 Not Found

  Scenario: Request to /api returns 404
    When a client makes a GET request to /api
    Then the response status is 404 Not Found

  Scenario: Request to /api/v1 returns 404
    When a client makes a GET request to /api/v1
    Then the response status is 404 Not Found

  Scenario: Request with leading slashes in path is handled
    When a client makes a GET request to /api/v1/greeting/
    Then the response status is either 200 OK or 404 Not Found
    # (HTTP frameworks vary; this captures the acceptable outcomes)

  # ─────────────────────────────────────────────────────────────
  # Path Case Sensitivity
  # ─────────────────────────────────────────────────────────────

  Scenario: Path is case-sensitive (lowercase expected)
    When a client makes a GET request to /api/v1/greeting
    Then the response status is 200 OK

  Scenario: Uppercase path variant returns 404
    When a client makes a GET request to /api/v1/Greeting
    Then the response status is 404 Not Found

  Scenario: Mixed case path variant returns 404
    When a client makes a GET request to /api/v1/GREETING
    Then the response status is 404 Not Found

  # ─────────────────────────────────────────────────────────────
  # Response Format and Headers
  # ─────────────────────────────────────────────────────────────

  Scenario: Response has correct content-type header
    When a client makes a GET request to /api/v1/greeting
    Then the response header Content-Type is "application/json; charset=utf-8"

  Scenario: Response includes cache-control header
    When a client makes a GET request to /api/v1/greeting
    Then the response header Cache-Control is "public, max-age=3600"

  Scenario: Response body is valid JSON (parseable)
    When a client makes a GET request to /api/v1/greeting
    Then the response body can be parsed as JSON without error

  Scenario: Response has no unexpected status codes
    When a client makes a GET request to /api/v1/greeting
    Then the response status is 200 OK
    And the response status is not 201, 204, 301, 302, 400, 401, 403, 409, or 500

  # ─────────────────────────────────────────────────────────────
  # Idempotency and Consistency
  # ─────────────────────────────────────────────────────────────

  Scenario: Multiple identical requests produce identical responses
    When a client makes three consecutive GET requests to /api/v1/greeting
    Then all three responses have status 200 OK
    And all three response bodies are identical
    And all three responses have the same headers

  Scenario: Response is deterministic (no random content)
    When a client makes a GET request to /api/v1/greeting
    And repeats the request after a 1-second delay
    Then the response body is identical both times
    And the message field is always "hello world"

  # ─────────────────────────────────────────────────────────────
  # Error Handling: Graceful Degradation
  # ─────────────────────────────────────────────────────────────

  Scenario: 404 error response is properly formatted
    When a client makes a GET request to /api/v1/nonexistent
    Then the response status is 404 Not Found
    And the response body is valid JSON
    And the response body has an "error" field
    And the response header Content-Type is "application/json; charset=utf-8"

  Scenario: 405 error response is properly formatted
    When a client makes a POST request to /api/v1/greeting
    Then the response status is 405 Method Not Allowed
    And the response body is valid JSON
    And the response body has an "error" field
    And the response header Allow is present
    And the response header Content-Type is "application/json; charset=utf-8"

  Scenario: Error responses include meaningful messages
    When a client makes a GET request to /api/v1/nonexistent
    Then the response body contains "error"
    And the error message is not empty

  # ─────────────────────────────────────────────────────────────
  # Edge Cases: Request Body and Content
  # ─────────────────────────────────────────────────────────────

  Scenario: GET request with a request body is handled
    When a client makes a GET request to /api/v1/greeting
    And includes a JSON request body: { "ignored": true }
    Then the response status is 200 OK
    And the response body contains a field "message" with value "hello world"

  Scenario: Request with Content-Length header is accepted
    When a client makes a GET request to /api/v1/greeting
    And sets Content-Length header to 0
    Then the response status is 200 OK

  # ─────────────────────────────────────────────────────────────
  # Response Body Validation
  # ─────────────────────────────────────────────────────────────

  Scenario: Response message is exactly "hello world" (lowercase)
    When a client makes a GET request to /api/v1/greeting
    Then the response body field "message" equals "hello world"
    And the message is not "Hello World"
    And the message is not "HELLO WORLD"
    And the message is not "Hello world"

  Scenario: Response message is a string, not null or other type
    When a client makes a GET request to /api/v1/greeting
    Then the response body field "message" is of type string
    And the message is not null
    And the message is not a boolean or number

  Scenario: Response contains only expected fields
    When a client makes a GET request to /api/v1/greeting
    Then the response body is an object
    And the response body contains exactly one field: "message"
    And the response body does not contain fields like "id", "timestamp", "status", etc.

  # ─────────────────────────────────────────────────────────────
  # Caching Behavior
  # ─────────────────────────────────────────────────────────────

  Scenario: Cache-Control header enables public caching
    When a client makes a GET request to /api/v1/greeting
    Then the Cache-Control header contains "public"
    And the Cache-Control header contains "max-age"

  Scenario: Cache-Control max-age is 3600 seconds
    When a client makes a GET request to /api/v1/greeting
    Then the Cache-Control header is "public, max-age=3600"

  Scenario: Cache-Control does not disable caching
    When a client makes a GET request to /api/v1/greeting
    Then the Cache-Control header does not contain "no-cache"
    And the Cache-Control header does not contain "no-store"
    And the Cache-Control header does not contain "private"

  # ─────────────────────────────────────────────────────────────
  # Assumptions and Notes
  # ─────────────────────────────────────────────────────────────

  # ASSUMPTION: The endpoint is stateless and does not depend on:
  #   - Previous requests or session state
  #   - Database state
  #   - External service calls
  #   - Time-dependent logic (the response is consistent across time)
  #
  # ASSUMPTION: The response is deterministic:
  #   - Same input (GET /api/v1/greeting) always produces the same output
  #   - The message is always exactly "hello world"
  #
  # ASSUMPTION: HTTP semantics are strictly followed:
  #   - 200 means successful retrieval
  #   - 404 means resource not found
  #   - 405 means method not allowed
  #   - Appropriate headers are set (Content-Type, Cache-Control, Allow)
  #
  # ASSUMPTION: The endpoint supports only GET (and HEAD by HTTP spec):
  #   - POST, PUT, DELETE, PATCH all return 405
  #   - OPTIONS behavior is implementation-dependent (200 or 405 acceptable)
  #
  # ASSUMPTION: Path routing is exact and case-sensitive:
  #   - /api/v1/greeting matches
  #   - /api/v1/Greeting does not match
  #   - /api/v1/greetings (plural) does not match
  #   - Query parameters are ignored
  #
  # ASSUMPTION: The endpoint is available immediately after app startup:
  #   - No initialization or warm-up required
  #   - No authentication or authorization needed
  #   - No rate limiting or throttling is applied
  #
  # ASSUMPTION: Response format is JSON:
  #   - Content-Type is application/json; charset=utf-8
  #   - Body is valid, parseable JSON
  #   - Structure is { "message": "hello world" }

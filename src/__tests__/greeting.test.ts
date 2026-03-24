import { describe, it, expect } from "vitest";

/**
 * Greeting Endpoint Tests
 *
 * Behavioral Specs:
 * 1. The greeting endpoint responds with HTTP 200
 * 2. The response body contains greeting text (hello world or equivalent)
 * 3. The endpoint is accessible via HTTP
 */

describe("Greeting Endpoint", () => {
  /**
   * Test for Spec 1: Greeting endpoint returns HTTP 200
   *
   * Scenario: When a request is made to the greeting endpoint,
   * it returns a 200 status code
   */
  it("should return HTTP 200 status", async () => {
    // The endpoint path will be defined in the implementation RFC
    // Expected pattern: GET /greeting or /hello or similar
    const response = await fetch("http://localhost:5173/greeting");

    expect(response.status).toBe(200);
  });

  /**
   * Test for Spec 2: Greeting endpoint returns greeting content
   *
   * Scenario: When the greeting endpoint is called, the response
   * contains greeting text with "hello" and/or "world" or equivalent
   */
  it("should return greeting content", async () => {
    const response = await fetch("http://localhost:5173/greeting");
    const body = await response.text();

    // Body should not be empty and should contain greeting-like text
    expect(body).toBeTruthy();

    // Body should contain greeting keywords (case-insensitive)
    // Allows for variations like "hello", "Hello", "HELLO"
    const lowerBody = body.toLowerCase();
    const hasGreeting =
      lowerBody.includes("hello") ||
      lowerBody.includes("hi") ||
      lowerBody.includes("greet") ||
      lowerBody.includes("welcome");

    expect(hasGreeting).toBe(true);
  });

  /**
   * Test for Spec 1 & 2 Combined: Successful greeting response
   *
   * Scenario: A complete successful call to the greeting endpoint
   */
  it("should successfully return greeting on GET request", async () => {
    const response = await fetch("http://localhost:5173/greeting", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });
});

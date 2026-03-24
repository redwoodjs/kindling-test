import { describe, it, expect } from "vitest";

/**
 * BEHAVIORAL SPECIFICATIONS FOR GREETING ENDPOINT
 *
 * Feature: Greeting Endpoint
 *
 * Scenario 1: User requests the greeting endpoint
 * Given the application is running
 * When a GET request is made to the greeting endpoint
 * Then the response status code is 200
 * And the response body contains the text "hello world"
 * And the response has a Content-Type header
 *
 * Scenario 2: Greeting endpoint is accessible and consistent
 * Given the application is running
 * When multiple GET requests are made to the greeting endpoint
 * Then all responses have status code 200
 * And all responses contain "hello world"
 * And responses are consistent across multiple requests
 *
 * Scenario 3: Greeting endpoint handles standard HTTP semantics
 * Given the application is running
 * When a GET request is made to the greeting endpoint
 * Then the response is not empty
 * And the response Content-Type is appropriate (text/plain or application/json)
 */

describe("Greeting Endpoint", () => {
  // NOTE: These tests are written as black-box integration tests.
  // They verify the greeting endpoint contract via HTTP interface only.
  // The exact endpoint path will be determined by the RFC.
  // Tests assume endpoint is available at `/greeting` - adjust path as needed after RFC.

  it("should return 200 status code on GET request", async () => {
    // Scenario 1: Happy path - successful greeting request
    const response = await fetch("http://localhost:5173/greeting");
    expect(response.status).toBe(200);
  });

  it("should return response body containing 'hello world'", async () => {
    // Scenario 1: Verify response contains greeting text
    const response = await fetch("http://localhost:5173/greeting");
    const body = await response.text();
    expect(body).toContain("hello world");
  });

  it("should have a Content-Type header in response", async () => {
    // Scenario 1: Verify response includes appropriate content type
    const response = await fetch("http://localhost:5173/greeting");
    const contentType = response.headers.get("Content-Type");
    expect(contentType).toBeDefined();
    expect(contentType).toMatch(/text|json/i);
  });

  it("should return consistent response across multiple requests", async () => {
    // Scenario 2: Verify endpoint behavior is stable
    const response1 = await fetch("http://localhost:5173/greeting");
    const body1 = await response1.text();

    const response2 = await fetch("http://localhost:5173/greeting");
    const body2 = await response2.text();

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(body1).toBe(body2);
    expect(body1).toContain("hello world");
  });

  it("should not return an empty response", async () => {
    // Scenario 3: Verify response has content
    const response = await fetch("http://localhost:5173/greeting");
    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });
});

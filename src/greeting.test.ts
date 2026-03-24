import { describe, it, expect } from "vitest";

describe("Greeting Endpoint", () => {
  // Configuration for the greeting endpoint
  const baseUrl = process.env.API_BASE_URL || "http://localhost:5173";
  const greetingPath = process.env.GREETING_PATH || "/greeting";
  const greetingUrl = `${baseUrl}${greetingPath}`;

  describe("Endpoint Accessibility", () => {
    it("returns HTTP 200 status code", async () => {
      const response = await fetch(greetingUrl);
      expect(response.status).toBe(200);
    });

    it("responds to GET requests", async () => {
      const response = await fetch(greetingUrl, { method: "GET" });
      expect(response.status).toBe(200);
    });
  });

  describe("Response Content", () => {
    it("returns response body containing 'hello world'", async () => {
      const response = await fetch(greetingUrl);
      const text = await response.text();
      expect(text.toLowerCase()).toContain("hello world");
    });

    it("returns well-formed response", async () => {
      const response = await fetch(greetingUrl);
      const contentType = response.headers.get("content-type");
      expect(contentType).toBeTruthy();
    });
  });

  describe("Response Format", () => {
    it("includes Content-Type header", async () => {
      const response = await fetch(greetingUrl);
      const contentType = response.headers.get("content-type");
      expect(contentType).not.toBeNull();
      // Content-Type should be either text/plain or application/json (or variants)
      expect(
        contentType!.includes("text") || contentType!.includes("json")
      ).toBe(true);
    });
  });

  describe("Consistent Behavior", () => {
    it("returns same greeting on repeated requests", async () => {
      const response1 = await fetch(greetingUrl);
      const text1 = await response1.text();

      const response2 = await fetch(greetingUrl);
      const text2 = await response2.text();

      expect(text1).toBe(text2);
    });

    it("returns greeting regardless of additional headers", async () => {
      const response = await fetch(greetingUrl, {
        headers: {
          "X-Custom-Header": "test",
        },
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text.toLowerCase()).toContain("hello world");
    });
  });
});

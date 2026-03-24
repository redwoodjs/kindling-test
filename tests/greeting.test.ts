import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:5173";

describe("GET /greeting", () => {
  it("returns HTTP 200", async () => {
    const response = await fetch(`${BASE_URL}/greeting`);
    expect(response.status).toBe(200);
  });

  it("returns content-type text/plain", async () => {
    const response = await fetch(`${BASE_URL}/greeting`);
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("text/plain");
  });

  it('returns body that is exactly "hello world"', async () => {
    const response = await fetch(`${BASE_URL}/greeting`);
    const body = await response.text();
    expect(body).toBe("hello world");
  });

  it("returns consistent responses across multiple requests", async () => {
    const responses = await Promise.all(
      Array.from({ length: 3 }, () => fetch(`${BASE_URL}/greeting`)),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe("hello world");
    }
  });
});

import { describe, it, expect } from "vitest";

describe("Greeting Endpoint", () => {
  it("returns 200 status code when GET /api/greeting is requested", async () => {
    const response = await fetch("http://localhost:8787/api/greeting", {
      method: "GET",
    });

    expect(response.status).toBe(200);
  });

  it("returns plain text response with greeting message", async () => {
    const response = await fetch("http://localhost:8787/api/greeting", {
      method: "GET",
    });

    const body = await response.text();

    expect(body).toBe("Hello from kindling test");
  });

  it("returns content-type of text/plain", async () => {
    const response = await fetch("http://localhost:8787/api/greeting", {
      method: "GET",
    });

    expect(response.headers.get("content-type")).toBe("text/plain");
  });

  it("greeting endpoint responds successfully to requests", async () => {
    const response = await fetch("http://localhost:8787/api/greeting", {
      method: "GET",
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBeLessThan(400);
  });

  it("returns exactly the expected greeting text", async () => {
    const response = await fetch("http://localhost:8787/api/greeting", {
      method: "GET",
    });

    const body = await response.text();

    expect(body).toContain("Hello from kindling test");
    expect(body.trim()).toBe("Hello from kindling test");
  });
});

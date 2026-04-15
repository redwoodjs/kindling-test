import { describe, it } from "node:test";
import assert from "node:assert";

import { healthHandler, type HealthResponse } from "../app/pages/health.js";

describe("GET /health", () => {
  it("returns HTTP 200", () => {
    const response = healthHandler();
    assert.strictEqual(response.status, 200);
  });

  it("returns an exact JSON body of { status: \"ok\" }", async () => {
    const response = healthHandler();
    const body = (await response.json()) as HealthResponse;
    assert.deepStrictEqual(body, { status: "ok" });
  });

  it("sets Content-Type to application/json", () => {
    const response = healthHandler();
    const contentType = response.headers.get("content-type") ?? "";
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    );
  });
});

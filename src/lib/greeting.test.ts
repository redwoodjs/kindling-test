import { describe, it } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "./greeting.ts";

describe("greetingHandler", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler();
    assert.strictEqual(response.status, 200);
  });

  it("returns the string 'hello world' in the body", async () => {
    const response = greetingHandler();
    const body = await response.text();
    assert.strictEqual(body, "hello world");
  });

  it("sets Content-Type to text/plain", () => {
    const response = greetingHandler();
    assert.ok(
      response.headers.get("content-type")?.includes("text/plain"),
    );
  });
});

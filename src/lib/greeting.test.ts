import { describe, it } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "./greeting";

describe("greetingHandler", () => {
  it("returns HTTP 200", async () => {
    const response = greetingHandler();
    assert.strictEqual(response.status, 200);
  });

  it("returns Content-Type application/json", async () => {
    const response = greetingHandler();
    assert.ok(
      response.headers.get("Content-Type")?.includes("application/json"),
    );
  });

  it("returns 'hello world' as the greeting", async () => {
    const response = greetingHandler();
    const body = await response.json();
    assert.deepStrictEqual(body, { greeting: "hello world" });
  });
});

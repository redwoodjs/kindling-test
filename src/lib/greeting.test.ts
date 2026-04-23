import { describe, it } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "./greeting.ts";

describe("greetingHandler", () => {
  it("returns 200 with hello world JSON", async () => {
    const response = greetingHandler();

    assert.strictEqual(response.status, 200);
    assert.ok(
      response.headers.get("Content-Type")?.includes("application/json"),
    );

    const body = await response.json();
    assert.deepStrictEqual(body, { message: "hello world" });
  });
});

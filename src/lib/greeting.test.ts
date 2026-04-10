import { describe, it } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "./greeting";

describe("greetingHandler", () => {
  it("returns a 200 response with greeting set to hello world", async () => {
    const response = greetingHandler();
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.deepStrictEqual(body, { greeting: "hello world" });
  });
});

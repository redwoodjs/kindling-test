import { describe, it } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "../app/pages/greeting.js";

describe("greetingHandler", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler();
    assert.strictEqual(response.status, 200);
  });

  it("returns {greeting: 'hello world'}", async () => {
    const response = greetingHandler();
    const body = (await response.json()) as { greeting: string };
    assert.deepStrictEqual(body, { greeting: "hello world" });
  });
});

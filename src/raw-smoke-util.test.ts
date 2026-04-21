import { describe, it } from "node:test";
import assert from "node:assert";
import { greetRaw } from "./raw-smoke-util.ts";

describe("greetRaw", () => {
  it("greets kindling", () => {
    assert.strictEqual(greetRaw("kindling"), "hello, kindling!");
  });
});

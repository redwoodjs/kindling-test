import { test } from "node:test";
import assert from "node:assert";
import { greet } from "./greeting.ts";

test("greet() returns hello world", () => {
  assert.strictEqual(greet(), "hello world");
});

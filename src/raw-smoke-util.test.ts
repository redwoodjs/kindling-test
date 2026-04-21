import { test } from "node:test";
import assert from "node:assert";
import { greetRaw } from "./raw-smoke-util.ts";

test("greetRaw returns the correct greeting", () => {
  assert.strictEqual(greetRaw("kindling"), "hello, kindling!");
});

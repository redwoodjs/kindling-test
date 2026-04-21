import { test } from "node:test";
import assert from "node:assert/strict";
import { greetRaw } from "./raw-smoke-util.ts";

test("greetRaw returns correct greeting", () => {
  assert.strictEqual(greetRaw("kindling"), "hello, kindling!");
});

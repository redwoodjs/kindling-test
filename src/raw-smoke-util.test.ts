import { test } from "node:test";
import assert from "node:assert/strict";
import { greetRaw } from "./raw-smoke-util.ts";

test("greetRaw returns expected greeting", () => {
  assert.equal(greetRaw("kindling"), "hello, kindling!");
});

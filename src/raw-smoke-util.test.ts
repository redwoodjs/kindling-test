import { test } from "node:test";
import { strict as assert } from "node:assert";
import { greetRaw } from "./raw-smoke-util.ts";

test("greetRaw returns hello, kindling!", () => {
  assert.strictEqual(greetRaw("kindling"), "hello, kindling!");
});

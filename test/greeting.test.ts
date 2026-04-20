import test from "node:test";
import assert from "node:assert/strict";

import { greeting } from "../src/greeting.ts";

test("greeting returns hello world", () => {
  assert.strictEqual(greeting(), "hello world");
});

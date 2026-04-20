import test from "node:test";
import assert from "node:assert/strict";

import { greeting } from "./greeting.ts";

test("greeting returns hello world", () => {
  assert.equal(greeting(), "hello world");
});

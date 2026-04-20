import { test } from "node:test";
import assert from "node:assert/strict";
import { greet } from "./greeting.ts";

test("greet returns hello world", () => {
  assert.equal(greet(), "hello world");
});

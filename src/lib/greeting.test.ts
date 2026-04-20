import { test } from "node:test";
import assert from "node:assert/strict";
import { greet } from "./greeting.ts";

test("greet() returns Hello, World!", () => {
  assert.equal(greet(), "Hello, World!");
});

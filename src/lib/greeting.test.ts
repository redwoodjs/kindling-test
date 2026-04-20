import { test } from "node:test";
import assert from "node:assert";
import { greeting } from "./greeting.ts";

test("greeting returns hello world", () => {
  assert.strictEqual(greeting(), "hello world");
});

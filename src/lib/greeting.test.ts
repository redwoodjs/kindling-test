import { test } from "node:test";
import assert from "node:assert/strict";
import { greet, greetHandler } from "./greeting.ts";

test("greet returns the expected string", () => {
  const result = greet();
  assert.strictEqual(result, "Hello, World!");
});

test("greetHandler returns JSON with message field", async () => {
  const response = await greetHandler();
  const data = await response.json();
  assert.deepStrictEqual(data, { message: "Hello, World!" });
});

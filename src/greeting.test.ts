import test from "node:test";
import assert from "node:assert/strict";

import { greeting, greetingHandler } from "./greeting.ts";

test("greeting returns hello world", () => {
  assert.strictEqual(greeting(), "hello world");
});

test("greeting handler returns hello world response", async () => {
  const response = greetingHandler();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.strictEqual(await response.text(), "hello world");
});

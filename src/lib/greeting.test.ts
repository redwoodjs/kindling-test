import { test } from "node:test";
import assert from "node:assert";

import { greetingHandler } from "./greeting.ts";

test("greetingHandler returns 200 with hello world string", async () => {
  const response = greetingHandler();
  assert.strictEqual(response.status, 200);

  const contentType = response.headers.get("Content-Type");
  assert.ok(
    contentType?.includes("text/plain"),
    `Expected Content-Type to include text/plain, got ${contentType}`,
  );

  const body = await response.text();
  assert.strictEqual(body, "hello world");
});

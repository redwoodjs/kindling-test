import { it } from "node:test";
import assert from "node:assert";
import { greet } from "./greeting.ts";

it("greet returns hello world", () => {
  assert.strictEqual(greet(), "hello world");
});

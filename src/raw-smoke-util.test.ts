import { test } from "node:test";
import { strictEqual } from "node:assert";
import { greetRaw } from "./raw-smoke-util.ts";

test("greetRaw returns the expected greeting", () => {
  strictEqual(greetRaw("kindling"), "hello, kindling!");
});

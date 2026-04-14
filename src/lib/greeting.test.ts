import { describe, it } from "node:test";
import assert from "node:assert";
import { greeting } from "./greeting.ts";

describe("greeting", () => {
  it("returns 'hello world'", () => {
    const result = greeting();
    assert.equal(result, "hello world");
  });
});

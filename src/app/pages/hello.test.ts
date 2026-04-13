import { describe, it } from "node:test";
import assert from "node:assert";
import { helloHandler } from "./hello";

describe("helloHandler", () => {
  it("returns 200 with a hello world message", async () => {
    const res = helloHandler();
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { message: string };
    assert.strictEqual(body.message, "Hello, World!");
  });
});

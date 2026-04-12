import { test, describe } from "node:test";
import assert from "node:assert";
import { greetingHandler } from "./greeting.ts";

describe("greetingHandler", () => {
  test("returns 200 with JSON content-type", async () => {
    const response = greetingHandler();
    assert.equal(response.status, 200);
    assert.ok(
      response.headers.get("content-type")?.includes("application/json"),
    );
  });

  test("response body is { message: 'hello world' }", async () => {
    const response = greetingHandler();
    const body = (await response.json()) as { message: string };
    assert.equal(body.message, "hello world");
  });

  test("response body contains no extra fields", async () => {
    const response = greetingHandler();
    const body = (await response.json()) as Record<string, unknown>;
    const keys = Object.keys(body);
    assert.deepEqual(keys, ["message"]);
  });
});

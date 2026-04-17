import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting.ts"

describe("greet", () => {
  it("returns hello world", () => {
    assert.strictEqual(greet(), "hello world")
  })
})

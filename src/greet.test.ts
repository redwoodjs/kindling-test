import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greet.ts"

describe("greet", () => {
  it("returns hello plus the given name", () => {
    assert.strictEqual(greet("world"), "hello world")
  })

  it("handles empty string", () => {
    assert.strictEqual(greet(""), "hello ")
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting.ts"

describe("greet", () => {
  it("returns 'Hello World'", () => {
    assert.strictEqual(greet(), "Hello World")
  })

  it("returns a string", () => {
    assert.strictEqual(typeof greet(), "string")
  })
})

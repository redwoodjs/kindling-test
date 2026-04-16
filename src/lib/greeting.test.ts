import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting"

describe("greeting helper", () => {
  it("returns the exact greeting", () => {
    assert.strictEqual(greet(), "hello world")
  })

  it("returns the same greeting on repeated calls", () => {
    const results = [greet(), greet(), greet()]
    assert.deepStrictEqual(results, ["hello world", "hello world", "hello world"])
  })
})

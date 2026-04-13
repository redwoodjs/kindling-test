import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting"

describe("greeting", () => {
  it("returns 'hello world'", () => {
    assert.strictEqual(greet(), "hello world")
  })
})

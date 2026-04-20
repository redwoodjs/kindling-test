import { describe, it } from "node:test"
import assert from "node:assert"
import greeting from "./greeting"

describe("greeting", () => {
  it("returns the literal greeting", () => {
    assert.strictEqual(greeting(), "hello world")
  })
})

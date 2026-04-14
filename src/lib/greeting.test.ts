import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting } from "./greeting.ts"

describe("greeting()", () => {
  it("returns the string 'hello world'", () => {
    assert.strictEqual(greeting(), "hello world")
  })

  it("returns a string", () => {
    assert.strictEqual(typeof greeting(), "string")
  })
})

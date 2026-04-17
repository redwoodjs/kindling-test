import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting } from "./greeting.ts"

describe("greeting", () => {
  it("returns hello world", () => {
    assert.strictEqual(greeting(), "hello world")
  })

  it("returns a lowercase plain string without extra whitespace", () => {
    const value = greeting()
    assert.strictEqual(typeof value, "string")
    assert.strictEqual(value.trim(), "hello world")
    assert.strictEqual(value, value.toLowerCase())
  })
})

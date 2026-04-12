import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting } from "./greeting.ts"

describe("greeting", () => {
  it("returns the expected greeting string", () => {
    assert.strictEqual(greeting(), "hello world")
  })

  it("returns a non-empty string", () => {
    assert.ok(greeting().length > 0)
  })

  it("returns exactly 'hello world'", () => {
    const result = greeting()
    assert.strictEqual(result, "hello world")
    assert.strictEqual(result, "hello world")
  })
})

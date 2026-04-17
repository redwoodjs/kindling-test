import { describe, it } from "node:test"
import assert from "node:assert"

import { greeting } from "./greeting.ts"

describe("greeting", () => {
  it("returns hello world", () => {
    assert.strictEqual(greeting(), "hello world")
  })

  it("always returns the same greeting", () => {
    const first = greeting()
    const second = greeting()

    assert.strictEqual(first, "hello world")
    assert.strictEqual(second, "hello world")
    assert.strictEqual(first, second)
  })
})

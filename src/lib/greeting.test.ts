import assert from "node:assert"
import { describe, it } from "node:test"

import { greeting } from "./greeting.ts"

describe("greeting", () => {
  it("returns hello world", () => {
    assert.strictEqual(greeting(), "hello world")
  })

  it("always returns the same greeting", () => {
    assert.strictEqual(greeting(), greeting())
  })
})

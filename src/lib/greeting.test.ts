import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting } from "./greeting.ts"

describe("greeting", () => {
  it("returns the hello world string", () => {
    assert.strictEqual(greeting(), "hello world")
  })
})

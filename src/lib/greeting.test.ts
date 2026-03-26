import { describe, it } from "node:test"
import assert from "node:assert"
import { greet } from "./greeting.ts"

describe("greet", () => {
  it("returns a string", () => {
    assert.strictEqual(typeof greet("Alice"), "string")
  })

  it("contains the provided name", () => {
    const result = greet("Alice")
    assert.ok(result.includes("Alice"), `Expected "${result}" to contain "Alice"`)
  })

  it("contains a greeting word", () => {
    const result = greet("Alice")
    assert.ok(result.includes("Hello"), `Expected "${result}" to contain "Hello"`)
  })

  it("returns a complete greeting for a typical name", () => {
    const result = greet("Bob")
    assert.ok(result.includes("Hello"), `Expected greeting word in "${result}"`)
    assert.ok(result.includes("Bob"), `Expected name in "${result}"`)
  })

  it("returns a string when given an empty name", () => {
    assert.strictEqual(typeof greet(""), "string")
  })

  it("includes a multi-word name in the return value", () => {
    const result = greet("John Doe")
    assert.ok(result.includes("John Doe"), `Expected "${result}" to contain "John Doe"`)
  })

  it("preserves the case of the provided name", () => {
    const result = greet("mARY")
    assert.ok(result.includes("mARY"), `Expected "${result}" to preserve case "mARY"`)
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { add, subtract, multiply } from "./math.ts"

describe("math", () => {
  it("adds two numbers", () => {
    assert.strictEqual(add(1, 2), 3)
  })

  it("adds negative numbers", () => {
    assert.strictEqual(add(-1, -2), -3)
  })

  it("subtracts two numbers", () => {
    // Intentionally wrong expected value — should be 1, not 2
    assert.strictEqual(subtract(3, 2), 2)
  })

  it("multiplies two numbers", () => {
    // Intentionally wrong expected value — should be 6, not 8
    assert.strictEqual(multiply(2, 3), 8)
  })

  it("multiplies by zero", () => {
    assert.strictEqual(multiply(5, 0), 0)
  })
})

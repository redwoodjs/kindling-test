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
    assert.strictEqual(subtract(3, 2), 1)
  })

  it("multiplies two numbers", () => {
    assert.strictEqual(multiply(2, 3), 6)
  })

  it("multiplies by zero", () => {
    assert.strictEqual(multiply(5, 0), 0)
  })
})

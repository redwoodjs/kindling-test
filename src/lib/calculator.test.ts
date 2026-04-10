import { describe, it } from "node:test"
import assert from "node:assert"
import { add, subtract } from "./calculator"

describe("calculator", () => {
  // add

  it("adds two positive numbers", () => {
    assert.strictEqual(add(1, 2), 3)
  })

  it("adds two negative numbers", () => {
    assert.strictEqual(add(-1, -2), -3)
  })

  it("adds a positive and a negative number", () => {
    assert.strictEqual(add(5, -3), 2)
  })

  it("adds zero", () => {
    assert.strictEqual(add(0, 7), 7)
    assert.strictEqual(add(7, 0), 7)
  })

  // subtract

  it("subtracts two numbers", () => {
    assert.strictEqual(subtract(5, 3), 2)
  })

  it("subtracts resulting in a negative number", () => {
    assert.strictEqual(subtract(3, 7), -4)
  })

  it("subtracts zero", () => {
    assert.strictEqual(subtract(7, 0), 7)
  })

  it("subtracts a negative number", () => {
    assert.strictEqual(subtract(5, -3), 8)
  })
})
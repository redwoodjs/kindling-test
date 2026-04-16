import { describe, it } from "node:test"
import assert from "node:assert"
import { greetUser } from "./greet-user.ts"

describe("greetUser", () => {
  it("returns a greeting with the provided name", () => {
    assert.strictEqual(greetUser("Alice"), "Hello, Alice!")
  })

  it("returns a greeting with a different name", () => {
    assert.strictEqual(greetUser("Bob"), "Hello, Bob!")
  })
})

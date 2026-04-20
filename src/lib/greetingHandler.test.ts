import { describe, it } from "node:test"
import assert from "node:assert"
import { greetingHandler } from "./greetingHandler.ts"

describe("greetingHandler", () => {
  it("returns hello world message", async () => {
    const response = greetingHandler()
    const body = await response.json()
    assert.deepStrictEqual(body, { message: "hello world" })
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting } from "./greeting"

describe("greeting", () => {
  it("returns a JSON response with hello world message", async () => {
    const response = greeting()
    assert.ok(response instanceof Response)
    const body = await response.json()
    assert.deepStrictEqual(body, { message: "hello world" })
  })
})

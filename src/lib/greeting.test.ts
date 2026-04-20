import { describe, it } from "node:test"
import assert from "node:assert"
import { greetingHandler } from "./greeting.js"

describe("greetingHandler", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns {greeting: 'hello world'}", async () => {
    const response = greetingHandler()
    const body = await response.json()
    assert.deepStrictEqual(body, { greeting: "hello world" })
  })

  it("response sets a JSON content-type header", () => {
    const response = greetingHandler()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )
  })
})

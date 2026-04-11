import { describe, it } from "node:test"
import assert from "node:assert"
import { greetingHandler } from "./greeting.js"

describe("greetingHandler", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns the string 'hello world'", async () => {
    const response = greetingHandler()
    const text = await response.text()
    assert.strictEqual(text, "hello world")
  })

  it("returns a plain text content-type header", () => {
    const response = greetingHandler()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("text/plain"),
      `Expected content-type to include text/plain, got: ${contentType}`,
    )
  })
})

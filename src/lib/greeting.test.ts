import { describe, it } from "node:test"
import assert from "node:assert"
import { greetingHandler } from "./greeting.ts"

describe("GET /greeting", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns hello world in the body", async () => {
    const response = greetingHandler()
    assert.strictEqual(await response.text(), "hello world")
  })

  it("sets Content-Type to plain text", () => {
    const response = greetingHandler()
    assert.strictEqual(
      response.headers.get("content-type"),
      "text/plain; charset=utf-8",
    )
  })
})

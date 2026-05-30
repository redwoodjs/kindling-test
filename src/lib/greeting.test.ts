import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting, greetingHandler } from "./greeting.ts"

describe("greeting()", () => {
  it("returns 'hello world'", () => {
    assert.strictEqual(greeting(), "hello world")
  })
})

describe("GET /greeting", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns { message: 'hello world' } in the body", async () => {
    const response = greetingHandler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "hello world")
  })

  it("sets Content-Type to application/json", () => {
    const response = greetingHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

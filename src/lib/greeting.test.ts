import { describe, it } from "node:test"
import assert from "node:assert"
import { greeting, greetingHandler } from "./greeting.ts"

describe("greeting()", () => {
  it("returns the string 'hello world'", () => {
    assert.strictEqual(greeting(), "hello world")
  })
})

describe("GET /greeting", () => {
  it("returns HTTP 200", () => {
    const response = greetingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns greeting: 'hello world' in the body", async () => {
    const response = greetingHandler()
    const body = (await response.json()) as { greeting: string }
    assert.strictEqual(body.greeting, "hello world")
  })

  it("sets Content-Type to application/json", () => {
    const response = greetingHandler()
    assert.ok(
      response.headers.get("content-type")?.includes("application/json"),
    )
  })
})

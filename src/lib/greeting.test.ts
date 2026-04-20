import { describe, it } from "node:test"
import assert from "node:assert"
import { greet, greetHandler } from "./greeting.ts"

describe("greet()", () => {
  it("returns 'hello world'", () => {
    assert.strictEqual(greet(), "hello world")
  })
})

describe("GET /greet", () => {
  it("returns HTTP 200", async () => {
    const response = greetHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns message: 'hello world' in the body", async () => {
    const response = greetHandler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "hello world")
  })

  it("sets Content-Type to application/json", () => {
    const response = greetHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { greetHandler } from "./greet.ts"

describe("GET /greet", () => {
  it("returns HTTP 200", () => {
    const response = greetHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns hello world in the body", async () => {
    const response = greetHandler()
    const body = (await response.json()) as { greeting: string }
    assert.strictEqual(body.greeting, "hello world")
  })

  it("sets Content-Type to application/json", () => {
    const response = greetHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { helloHandler } from "./hello.ts"

describe("GET /hello", () => {
  it("returns HTTP 200", async () => {
    const response = helloHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns message: 'Hello, World!' in the body", async () => {
    const response = helloHandler()
    const body = (await response.json()) as { message: string }
    assert.strictEqual(body.message, "Hello, World!")
  })

  it("sets Content-Type to application/json", () => {
    const response = helloHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

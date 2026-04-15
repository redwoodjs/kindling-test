import { describe, it } from "node:test"
import assert from "node:assert"
import { readyHandler } from "./ready.ts"

describe("GET /ready", () => {
  it("returns HTTP 200", () => {
    const response = readyHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns exactly { ready: true }", async () => {
    const response = readyHandler()
    const body = (await response.json()) as { ready: true }
    assert.deepStrictEqual(body, { ready: true })
  })

  it("sets Content-Type to application/json", () => {
    const response = readyHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

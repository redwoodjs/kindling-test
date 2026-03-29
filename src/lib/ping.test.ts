import { describe, it } from "node:test"
import assert from "node:assert"
import { pingHandler } from "./ping.ts"

describe("pingHandler", () => {
  it("returns HTTP 200", async () => {
    const response = pingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns pong: true in the body", async () => {
    const response = pingHandler()
    const body = await response.json()
    assert.deepStrictEqual(body, { pong: true })
  })

  it("sets Content-Type to application/json", () => {
    const response = pingHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

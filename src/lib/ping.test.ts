import { describe, it } from "node:test"
import assert from "node:assert"
import { pingHandler } from "./ping.ts"

describe("GET /ping", () => {
  it("returns HTTP 200", async () => {
    const response = pingHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns pong: true in the body", async () => {
    const response = pingHandler()
    const body = (await response.json()) as { pong: boolean; timestamp: number }
    assert.strictEqual(body.pong, true)
  })

  it("returns a numeric timestamp in the body", async () => {
    const response = pingHandler()
    const body = (await response.json()) as { pong: boolean; timestamp: number }
    assert.strictEqual(typeof body.timestamp, "number")
  })

  it("sets Content-Type to application/json", () => {
    const response = pingHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

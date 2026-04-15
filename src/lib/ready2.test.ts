import { describe, it } from "node:test"
import assert from "node:assert"
import { ready2Handler } from "./ready2.ts"

describe("GET /ready2", () => {
  it("returns HTTP 200", async () => {
    const response = ready2Handler()
    assert.strictEqual(response.status, 200)
  })

  it("returns ready: y in the body", async () => {
    const response = ready2Handler()
    const body = (await response.json()) as { ready: string }
    assert.strictEqual(body.ready, "y")
  })

  it("sets Content-Type to application/json", () => {
    const response = ready2Handler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

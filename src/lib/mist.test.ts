import { describe, it } from "node:test"
import assert from "node:assert"
import { mistHandler } from "./mist.ts"

describe("GET /mist", () => {
  it("returns HTTP 200", () => {
    const response = mistHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns mist: true in the body", async () => {
    const response = mistHandler()
    const body = (await response.json()) as { mist: boolean }
    assert.strictEqual(body.mist, true)
  })

  it("sets Content-Type to application/json", () => {
    const response = mistHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

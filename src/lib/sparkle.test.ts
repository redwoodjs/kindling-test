import { describe, it } from "node:test"
import assert from "node:assert"
import { sparkleHandler } from "./sparkle.ts"

describe("GET /sparkle", () => {
  it("returns HTTP 200", () => {
    const response = sparkleHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns sparkle: true in the body", async () => {
    const response = sparkleHandler()
    const body = (await response.json()) as { sparkle: boolean }
    assert.deepStrictEqual(body, { sparkle: true })
  })

  it("sets Content-Type to application/json", () => {
    const response = sparkleHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

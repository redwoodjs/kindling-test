import { describe, it } from "node:test"
import assert from "node:assert"
import { waveHandler } from "./wave.ts"

describe("GET /wave", () => {
  it("returns HTTP 200", async () => {
    const response = waveHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns wave: true in the body", async () => {
    const response = waveHandler()
    const body = (await response.json()) as { wave: boolean }
    assert.strictEqual(body.wave, true)
  })

  it("sets Content-Type to application/json", () => {
    const response = waveHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

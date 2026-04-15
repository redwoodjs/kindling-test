import { describe, it } from "node:test"
import assert from "node:assert"
import { beaconHandler } from "./beacon.ts"

describe("GET /beacon", () => {
  it("returns HTTP 200", async () => {
    const response = beaconHandler()
    assert.strictEqual(response.status, 200)
  })

  it("returns lit: true in the body", async () => {
    const response = beaconHandler()
    const body = (await response.json()) as { lit: boolean }
    assert.deepStrictEqual(body, { lit: true })
  })

  it("sets Content-Type to application/json", () => {
    const response = beaconHandler()
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
  })
})

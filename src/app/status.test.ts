import { describe, it, before } from "node:test"
import assert from "node:assert"
import { statusHandler } from "./status.js"

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

describe("GET /status", () => {
  let response: Response

  before(async () => {
    response = statusHandler.get()
  })

  it("returns HTTP 200", () => {
    assert.strictEqual(response.status, 200)
  })

  it("responds with application/json content type", () => {
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include "application/json", got: "${contentType}"`,
    )
  })

  it("response body is valid JSON", async () => {
    const res = statusHandler.get()
    const text = await res.text()
    assert.doesNotThrow(
      () => JSON.parse(text),
      "Response body must be parseable as JSON",
    )
  })

  it("response body contains exactly the keys: status, time, uptime, version", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    const keys = Object.keys(body).sort()
    assert.deepStrictEqual(
      keys,
      ["status", "time", "uptime", "version"],
      `Expected exactly ["status", "time", "uptime", "version"], got ${JSON.stringify(keys)}`,
    )
  })

  it("status field equals \"ok\"", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    assert.strictEqual(body.status, "ok", `status must be "ok", got "${body.status}"`)
  })

  it("time is a string that parses as a valid ISO 8601 UTC date", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    assert.strictEqual(typeof body.time, "string", "time must be a string")
    const parsed = new Date(body.time as string)
    assert.ok(!isNaN(parsed.getTime()), `time "${body.time}" must parse as a valid date`)
    assert.ok(
      (body.time as string).endsWith("Z"),
      `time "${body.time}" must be in ISO 8601 UTC format (ending with "Z")`,
    )
  })

  it("time is within ±10 seconds of the current wall clock", async () => {
    const wallBefore = Date.now()
    const res = statusHandler.get()
    const wallAfter = Date.now()
    const body = (await res.json()) as Record<string, unknown>
    const serverTime = new Date(body.time as string).getTime()
    assert.ok(
      serverTime >= wallBefore - 10_000 && serverTime <= wallAfter + 10_000,
      `time "${body.time}" must be within ±10 seconds of the request time`,
    )
  })

  it("uptime is a non-negative finite number", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    assert.strictEqual(typeof body.uptime, "number", "uptime must be a number")
    assert.ok(isFinite(body.uptime as number), "uptime must be finite (not NaN or Infinity)")
    assert.ok((body.uptime as number) >= 0, "uptime must be non-negative")
  })

  it("uptime grows between sequential requests separated by ~1 second", async () => {
    const res1 = statusHandler.get()
    const body1 = (await res1.json()) as Record<string, unknown>
    await sleep(1100)
    const res2 = statusHandler.get()
    const body2 = (await res2.json()) as Record<string, unknown>
    assert.ok(
      (body2.uptime as number) > (body1.uptime as number),
      `Second uptime (${body2.uptime}) must be greater than first (${body1.uptime})`,
    )
  })

  it("version is a non-empty string", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    assert.strictEqual(typeof body.version, "string", "version must be a string")
    assert.ok((body.version as string).length > 0, "version must be non-empty")
  })

  it("version matches the declared package version", async () => {
    const res = statusHandler.get()
    const body = (await res.json()) as Record<string, unknown>
    assert.strictEqual(
      body.version,
      "1.0.0",
      `version must equal "1.0.0", got "${body.version}"`,
    )
  })
})

import { describe, it } from "node:test"
import assert from "node:assert"
import { diag4Handler } from "./diag4.js"

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isUtcTimestamp = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.endsWith("Z")) {
    return false
  }

  return !Number.isNaN(Date.parse(value))
}

const readBody = async (): Promise<Record<string, unknown>> =>
  (await diag4Handler.get().json()) as Record<string, unknown>

const topLevelStrings = (body: Record<string, unknown>): string[] =>
  Object.values(body).filter((value): value is string => typeof value === "string")

describe("GET /diag4", () => {
  it("returns HTTP 200", () => {
    const response = diag4Handler.get()
    assert.strictEqual(response.status, 200)
  })

  it("responds with JSON and marks the snapshot as non-cacheable", () => {
    const response = diag4Handler.get()
    const contentType = response.headers.get("content-type") ?? ""
    const cacheControl = response.headers.get("cache-control") ?? ""

    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include "application/json", got: "${contentType}"`,
    )
    assert.match(
      cacheControl.toLowerCase(),
      /no-store/,
      `Expected cache-control to prevent caching, got: "${cacheControl}"`,
    )
  })

  it("returns a stable JSON object with diagnostic metadata", async () => {
    const first = await readBody()
    const second = await readBody()

    assert.ok(isPlainObject(first), "Response body must be a JSON object")
    assert.ok(isPlainObject(second), "Response body must be a JSON object")
    assert.deepStrictEqual(
      Object.keys(first).sort(),
      Object.keys(second).sort(),
      "Response schema must stay stable between requests",
    )
    assert.notDeepStrictEqual(
      first,
      second,
      "Diagnostic snapshots must include request-specific data",
    )

    const values = Object.values(first)
    const strings = topLevelStrings(first)
    const sharedStrings = strings.filter((value) => topLevelStrings(second).includes(value))

    assert.ok(
      values.some((value) => value === true || value === "ok"),
      "Expected a success state in the response",
    )
    assert.ok(
      values.some((value) => typeof value === "string" && UUID_V4_RE.test(value)),
      "Expected a server-generated correlation id that looks like a UUID v4",
    )
    assert.ok(
      values.some((value) => isUtcTimestamp(value)),
      "Expected a UTC timestamp in the response",
    )
    assert.ok(
      values.some((value) => typeof value === "number" && Number.isFinite(value) && value >= 0),
      "Expected a non-negative instance age or uptime value",
    )
    assert.ok(
      sharedStrings.some((value) => SEMVER_RE.test(value)),
      "Expected a build version string that stays stable across requests",
    )
    assert.ok(
      sharedStrings.some(
        (value) =>
          !SEMVER_RE.test(value) &&
          value !== "ok" &&
          !UUID_V4_RE.test(value) &&
          !isUtcTimestamp(value),
      ),
      "Expected a stable schema marker that stays the same across requests",
    )
    assert.ok(
      values.some((value) => Array.isArray(value) || isPlainObject(value)),
      "Expected a local checks collection in the response",
    )
  })

  it("does not expose obvious request or secret data", async () => {
    const body = await readBody()
    const serialized = JSON.stringify(body).toLowerCase()

    for (const forbidden of [
      "authorization",
      "cookie",
      "set-cookie",
      "secret",
      "token",
      "password",
      "bearer",
    ]) {
      assert.ok(
        !serialized.includes(forbidden),
        `Response must not include "${forbidden}"`,
      )
    }
  })

  it("exposes GET only on the handler contract", () => {
    assert.strictEqual(typeof diag4Handler.get, "function")
    assert.strictEqual("post" in diag4Handler, false)
    assert.strictEqual("put" in diag4Handler, false)
    assert.strictEqual("delete" in diag4Handler, false)
  })
})

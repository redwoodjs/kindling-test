import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert"
import {
  createHealthHandler,
  START_TIME,
  type HealthResponse,
} from "../app/pages/health.js"

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

describe("healthHandler", () => {
  it("returns HTTP 200 when uptime is under 24 hours", () => {
    const handler = createHealthHandler(() => 1000)
    const response = handler()
    assert.strictEqual(response.status, 200)
  })

  it("returns {healthy: true} with no warning when uptime is under 24 hours", async () => {
    const handler = createHealthHandler(() => 1000)
    const body = (await handler().json()) as HealthResponse
    assert.deepStrictEqual(body, { healthy: true })
  })

  it("returns {healthy: true} with no warning when uptime is exactly 24 hours (boundary)", async () => {
    const handler = createHealthHandler(() => TWENTY_FOUR_HOURS_MS)
    const body = (await handler().json()) as HealthResponse
    assert.deepStrictEqual(body, { healthy: true })
    assert.strictEqual("warning" in body, false)
  })

  it("returns HTTP 200 when uptime exceeds 24 hours", () => {
    const handler = createHealthHandler(() => TWENTY_FOUR_HOURS_MS + 1)
    const response = handler()
    assert.strictEqual(response.status, 200)
  })

  it("returns warning field when uptime exceeds 24 hours", async () => {
    const handler = createHealthHandler(() => TWENTY_FOUR_HOURS_MS + 1)
    const body = (await handler().json()) as HealthResponse
    assert.deepStrictEqual(body, {
      healthy: true,
      warning: "uptime exceeds 24h, consider recycling",
    })
  })

  it("warning field is present for substantially long uptime (25 hours)", async () => {
    const handler = createHealthHandler(() => 25 * 60 * 60 * 1000)
    const body = (await handler().json()) as HealthResponse & {
      warning?: string
    }
    assert.strictEqual(body.healthy, true)
    assert.strictEqual(body.warning, "uptime exceeds 24h, consider recycling")
  })

  it("healthy field is always true regardless of uptime", async () => {
    const shortUptime = createHealthHandler(() => 0)
    const longUptime = createHealthHandler(() => TWENTY_FOUR_HOURS_MS + 1)
    const bodyShort = (await shortUptime().json()) as HealthResponse
    const bodyLong = (await longUptime().json()) as HealthResponse
    assert.strictEqual(bodyShort.healthy, true)
    assert.strictEqual(bodyLong.healthy, true)
  })

  it("response sets a JSON content-type header", () => {
    const handler = createHealthHandler(() => 0)
    const response = handler()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )
  })

  describe("warning field via mocked START_TIME", () => {
    let savedStartTime: number

    beforeEach(() => {
      savedStartTime = START_TIME.value
    })

    afterEach(() => {
      START_TIME.value = savedStartTime
    })

    it("returns warning when START_TIME is set to 25 hours ago (default uptime path)", async () => {
      // Override the module-level start timestamp to simulate an isolate that
      // has been running for 25 hours, then use the default (no-arg) handler so
      // the real defaultGetUptimeMs() code path is exercised.
      START_TIME.value = Date.now() - 25 * 60 * 60 * 1000
      const handler = createHealthHandler()
      const body = (await handler().json()) as HealthResponse & {
        warning?: string
      }
      assert.strictEqual(body.healthy, true)
      assert.strictEqual(body.warning, "uptime exceeds 24h, consider recycling")
    })

    it("returns no warning when START_TIME is recent (default uptime path)", async () => {
      // Start time just set to now — uptime is effectively 0 ms.
      START_TIME.value = Date.now()
      const handler = createHealthHandler()
      const body = (await handler().json()) as HealthResponse
      assert.deepStrictEqual(body, { healthy: true })
    })
  })

  describe("configurable threshold", () => {
    it("returns no warning when uptime is under a custom threshold", async () => {
      const ONE_HOUR_MS = 60 * 60 * 1000
      const handler = createHealthHandler(() => ONE_HOUR_MS - 1, ONE_HOUR_MS)
      const body = (await handler().json()) as HealthResponse
      assert.deepStrictEqual(body, { healthy: true })
    })

    it("returns warning when uptime exceeds a custom threshold", async () => {
      const ONE_HOUR_MS = 60 * 60 * 1000
      const handler = createHealthHandler(() => ONE_HOUR_MS + 1, ONE_HOUR_MS)
      const body = (await handler().json()) as HealthResponse & {
        warning?: string
      }
      assert.strictEqual(body.healthy, true)
      assert.strictEqual(body.warning, "uptime exceeds 24h, consider recycling")
    })
  })
})

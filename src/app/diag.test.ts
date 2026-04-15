import { describe, it } from "node:test"
import assert from "node:assert"
import { createDiagHandler } from "./diag.js"

const DIAG_TOKEN = "diag-test-token"
const DIAG_ENVIRONMENT = "qa"
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type DiagHandler =
  | ((request: Request) => Response | Promise<Response>)
  | {
      get: (request: Request) => Response | Promise<Response>
    }

const makeRequest = (token?: string) => {
  const init: RequestInit = token
    ? { headers: { authorization: `Bearer ${token}` } }
    : {}

  return new Request("http://localhost/diag", init)
}

const callDiagHandler = async (
  handler: DiagHandler,
  request: Request,
): Promise<Response> => {
  if (typeof handler === "function") {
    return await handler(request)
  }

  return await handler.get(request)
}

const assertExactKeys = (value: unknown, expectedKeys: string[]) => {
  assert.ok(value !== null && typeof value === "object", "Expected an object")
  const keys = Object.keys(value as Record<string, unknown>).sort()
  assert.deepStrictEqual(
    keys,
    [...expectedKeys].sort(),
    `Expected exactly ${JSON.stringify(expectedKeys)}, got ${JSON.stringify(keys)}`,
  )
}

const assertNoStore = (response: Response) => {
  const cacheControl = response.headers.get("cache-control") ?? ""
  assert.ok(
    cacheControl.includes("no-store"),
    `Expected cache-control to include "no-store", got: "${cacheControl}"`,
  )
}

describe("GET /diag", () => {
  it("returns 404 when the route is not configured with an operator token", async () => {
    const handler = createDiagHandler()
    const response = await callDiagHandler(handler, makeRequest())

    assert.strictEqual(response.status, 404)
    assertNoStore(response)
  })

  it("returns 404 when the presented token does not match", async () => {
    const handler = createDiagHandler({ token: DIAG_TOKEN })
    const response = await callDiagHandler(handler, makeRequest("wrong-token"))

    assert.strictEqual(response.status, 404)
    assertNoStore(response)
  })

  it("returns HTTP 200 with JSON and no-store caching for an authorized request", async () => {
    const handler = createDiagHandler({ token: DIAG_TOKEN })
    const response = await callDiagHandler(handler, makeRequest(DIAG_TOKEN))

    assert.strictEqual(response.status, 200)

    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include "application/json", got: "${contentType}"`,
    )

    assertNoStore(response)
  })

  it("returns an allowlisted redacted snapshot by default", async () => {
    const handler = createDiagHandler({ token: DIAG_TOKEN })
    const response = await callDiagHandler(handler, makeRequest(DIAG_TOKEN))
    const body = (await response.json()) as Record<string, unknown>

    assertExactKeys(body, [
      "status",
      "schemaVersion",
      "requestId",
      "time",
      "uptime",
      "build",
      "runtime",
      "checks",
    ])
    assert.strictEqual(body.status, "ok")
    assert.strictEqual(body.schemaVersion, 1)

    assert.strictEqual(typeof body.requestId, "string")
    assert.ok(
      UUID_V4_REGEX.test(body.requestId as string),
      `requestId "${body.requestId}" must be a valid UUID v4`,
    )

    assert.strictEqual(typeof body.time, "string")
    const parsedTime = new Date(body.time as string)
    assert.ok(
      !Number.isNaN(parsedTime.getTime()),
      `time "${body.time}" must parse as a valid date`,
    )
    assert.ok(
      (body.time as string).endsWith("Z"),
      `time "${body.time}" must be an ISO 8601 UTC string`,
    )
    assert.ok(
      Math.abs(parsedTime.getTime() - Date.now()) <= 10_000,
      `time "${body.time}" must be close to the current wall clock`,
    )

    assert.strictEqual(typeof body.uptime, "number")
    assert.ok(Number.isInteger(body.uptime as number))
    assert.ok((body.uptime as number) >= 0)

    const build = body.build as Record<string, unknown>
    assertExactKeys(build, ["version"])
    assert.strictEqual(build.version, "1.0.0")

    const runtime = body.runtime as Record<string, unknown>
    assertExactKeys(runtime, ["platform"])
    assert.strictEqual(runtime.platform, "cloudflare-workers")

    const checks = body.checks as Record<string, unknown>
    assertExactKeys(checks, ["redacted", "environmentConfigured"])
    assert.strictEqual(checks.redacted, true)
    assert.strictEqual(checks.environmentConfigured, false)
  })

  it("includes the configured environment label without exposing extra runtime fields", async () => {
    const handler = createDiagHandler({
      token: DIAG_TOKEN,
      environment: DIAG_ENVIRONMENT,
    })
    const response = await callDiagHandler(handler, makeRequest(DIAG_TOKEN))
    const body = (await response.json()) as Record<string, unknown>

    const runtime = body.runtime as Record<string, unknown>
    assertExactKeys(runtime, ["environment", "platform"])
    assert.strictEqual(runtime.platform, "cloudflare-workers")
    assert.strictEqual(runtime.environment, DIAG_ENVIRONMENT)

    const checks = body.checks as Record<string, unknown>
    assert.strictEqual(checks.environmentConfigured, true)
  })

  it("generates a fresh requestId for each authorized request", async () => {
    const handler = createDiagHandler({ token: DIAG_TOKEN })

    const firstResponse = await callDiagHandler(handler, makeRequest(DIAG_TOKEN))
    const secondResponse = await callDiagHandler(handler, makeRequest(DIAG_TOKEN))
    const first = (await firstResponse.json()) as Record<string, unknown>
    const second = (await secondResponse.json()) as Record<string, unknown>

    assert.notStrictEqual(
      first.requestId,
      second.requestId,
      "requestId must be unique per request",
    )
  })
})

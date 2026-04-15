import { describe, it } from "node:test"
import assert from "node:assert"
import { defineRoutes, route } from "../../node_modules/rwsdk/dist/runtime/lib/router.js"
import { pulseHandler } from "./pulse.ts"

function createPulseResponse(method: "GET" | "POST" = "GET") {
  const request = new Request("https://example.com/pulse", { method })
  const requestInfo = {
    request,
    path: "/",
    params: {},
    ctx: {},
    cf: {},
    rw: {},
    response: { status: 200, headers: new Headers() },
  } as any

  const router = defineRoutes([
    route("/pulse", { get: pulseHandler }),
  ])

  return router.handle({
    request,
    renderPage: async () => new Response(null),
    getRequestInfo: () => requestInfo,
    onError: () => {},
    runWithRequestInfoOverrides: async (overrides, fn) => {
      const previous = { ...requestInfo }
      Object.assign(requestInfo, overrides)
      try {
        return await fn()
      } finally {
        Object.assign(requestInfo, previous)
      }
    },
    rscActionHandler: async () => undefined,
  })
}

describe("GET /pulse", () => {
  it("returns HTTP 200", async () => {
    const response = await createPulseResponse()
    assert.strictEqual(response.status, 200)
  })

  it("responds with application/json content type", async () => {
    const response = await createPulseResponse()
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )
  })

  it("returns the exact heartbeat payload", async () => {
    const response = await createPulseResponse()
    const body = (await response.json()) as Record<string, unknown>
    assert.deepStrictEqual(body, { beat: "steady" })
  })
})

describe("POST /pulse", () => {
  it("returns HTTP 405", async () => {
    const response = await createPulseResponse("POST")
    assert.strictEqual(response.status, 405)
  })
})

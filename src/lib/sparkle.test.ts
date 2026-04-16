import { describe, it } from "node:test"
import assert from "node:assert"
import { defineRoutes, route } from "../../node_modules/rwsdk/dist/runtime/lib/router.js"
import { sparkleHandler } from "./sparkle.ts"

const router = defineRoutes([
  route("/sparkle", { get: sparkleHandler, config: { disableOptions: true } }),
])

function createRouteDependencies(request: Request) {
  const requestInfo: any = {
    request,
    path: "/",
    params: {},
    ctx: {},
    rw: {
      nonce: "test-nonce",
      Document: (() => null) as any,
      rscPayload: true,
      ssr: true,
      databases: new Map(),
      scriptsToBeLoaded: new Set(),
      entryScripts: new Set(),
      inlineScripts: new Set(),
      pageRouteResolved: undefined,
    },
    cf: {} as any,
    response: { status: 200, headers: new Headers() },
    isAction: false,
  }

  return {
    getRequestInfo: () => requestInfo,
    onError: (error: unknown) => {
      throw error
    },
    renderPage: async () => new Response("unexpected render"),
    rscActionHandler: async () => undefined,
    runWithRequestInfoOverrides: async <Result>(overrides: any, fn: () => Promise<Result>) => {
      Object.assign(requestInfo, overrides)
      return await fn()
    },
  }
}

async function request(method: string): Promise<Response> {
  const request = new Request("http://localhost/sparkle", { method })
  const deps = createRouteDependencies(request)
  return router.handle({
    request,
    renderPage: deps.renderPage,
    getRequestInfo: deps.getRequestInfo,
    onError: deps.onError,
    runWithRequestInfoOverrides: deps.runWithRequestInfoOverrides,
    rscActionHandler: deps.rscActionHandler,
  })
}

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

describe("GET /sparkle route", () => {
  it("returns the sparkle response on GET", async () => {
    const response = await request("GET")
    assert.strictEqual(response.status, 200)
    assert.ok(response.headers.get("content-type")?.includes("application/json"))
    const body = (await response.json()) as { sparkle: boolean }
    assert.deepStrictEqual(body, { sparkle: true })
  })

  for (const method of ["HEAD", "POST", "OPTIONS"] as const) {
    it(`returns HTTP 405 for ${method}`, async () => {
      const response = await request(method)
      assert.strictEqual(response.status, 405)
      assert.strictEqual(response.headers.get("allow"), "GET")
      assert.strictEqual(await response.text(), "Method Not Allowed")
    })
  }
})

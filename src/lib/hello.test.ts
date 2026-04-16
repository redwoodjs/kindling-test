import { describe, it } from "node:test"
import assert from "node:assert"
import { defineRoutes, route } from "../../node_modules/rwsdk/dist/runtime/lib/router.js"
import { helloHandler } from "./hello.ts"

const router = defineRoutes([
  route("/hello", {
    get: helloHandler,
  }),
])

type MockRequestInfo = {
  request: Request
  path: string
  params: Record<string, string>
  ctx: Record<string, unknown>
  rw: {
    nonce: string
    Document: () => Response
    rscPayload: boolean
    ssr: boolean
    databases: Map<unknown, unknown>
    scriptsToBeLoaded: Set<unknown>
    entryScripts: Set<unknown>
    inlineScripts: Set<unknown>
    pageRouteResolved?: { resolve: () => void }
  }
  cf: Record<string, unknown>
  response: { headers: Headers }
  isAction: boolean
}

async function fetchHello(method = "GET") {
  const requestInfo = {
    request: new Request("https://example.test/hello", { method }),
    path: "/hello",
    params: {},
    ctx: {},
    rw: {
      nonce: "test-nonce",
      Document: () => new Response(null),
      rscPayload: true,
      ssr: true,
      databases: new Map(),
      scriptsToBeLoaded: new Set(),
      entryScripts: new Set(),
      inlineScripts: new Set(),
      pageRouteResolved: undefined,
    },
    cf: {},
    response: { headers: new Headers() },
    isAction: false,
  } as any

  return router.handle({
    request: requestInfo.request,
    renderPage: async () => {
      throw new Error("renderPage should not be called for /hello")
    },
    getRequestInfo: () => requestInfo,
    onError: (error: unknown) => {
      throw error
    },
    runWithRequestInfoOverrides: async <Result>(
      overrides: unknown,
      fn: () => Promise<Result>,
    ): Promise<Result> => {
      Object.assign(requestInfo, overrides as object)
      return await fn()
    },
    rscActionHandler: async () => undefined,
  })
}

describe("GET /hello", () => {
  it("returns HTTP 200 with a JSON hello world payload", async () => {
    const response = await fetchHello()

    assert.strictEqual(response.status, 200)
    const contentType = response.headers.get("content-type") ?? ""
    assert.ok(
      contentType.includes("application/json"),
      `Expected content-type to include application/json, got: ${contentType}`,
    )

    const body = (await response.json()) as { greeting: string }
    assert.deepStrictEqual(body, { greeting: "hello world" })
  })

  it("returns HTTP 405 for POST", async () => {
    const response = await fetchHello("POST")
    assert.strictEqual(response.status, 405)
  })
})
